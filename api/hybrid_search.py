import json
import logging
import re
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

from langchain_core.documents import Document
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError


COLLECTION_NAME = "sop_ik_documents_voyage"
RRF_K = 60
logger = logging.getLogger(__name__)
STOPWORDS = {
    "ada",
    "adalah",
    "aku",
    "apa",
    "apakah",
    "atau",
    "bagaimana",
    "baru",
    "barusan",
    "buat",
    "cetak",
    "dalam",
    "dan",
    "dari",
    "dengan",
    "di",
    "dokumen",
    "form",
    "formulir",
    "guna",
    "gunakan",
    "habis",
    "harus",
    "ik",
    "ini",
    "ijin",
    "izin",
    "itu",
    "kalau",
    "ke",
    "ku",
    "masuk",
    "mana",
    "mengenai",
    "nomor",
    "pada",
    "pakai",
    "permohonan",
    "perlu",
    "print",
    "saya",
    "setelah",
    "siapa",
    "sop",
    "tentang",
    "untuk",
    "yang",
}
QUERY_EXPANSIONS = {
    "sakit": (
        "sick",
        "leave",
        "absent",
        "cuti",
        "absen",
        "Leave/Absent Form",
        "Permohonan Cuti Izin Absen",
    ),
    "sembuh": (
        "sakit",
        "sick",
        "leave",
        "absent",
        "cuti",
        "absen",
        "Leave/Absent Form",
    ),
}


def _query_expansions(query: str) -> list[str]:
    normalized_query = query.lower()
    expansions = []
    for term, aliases in QUERY_EXPANSIONS.items():
        if re.search(rf"\b{re.escape(term)}\b", normalized_query):
            expansions.extend(aliases)
    return expansions


def _semantic_query(query: str) -> str:
    expansions = _query_expansions(query)
    if not expansions:
        return query
    return f"{query}\nIstilah internal terkait: {', '.join(expansions)}"


def _keyword_tsquery(query: str) -> str | None:
    """Build a safe OR query from meaningful words, document codes, and numbers."""
    tokens = []
    expanded_query = " ".join([query, *_query_expansions(query)])
    for token in re.findall(r"[a-z0-9]+", expanded_query.lower()):
        if token in STOPWORDS:
            continue
        if len(token) < 3 and not token.isdigit():
            continue
        if token not in tokens:
            tokens.append(token)
    return " | ".join(f"{token}:*" for token in tokens[:12]) or None


def _keyword_weight(query: str) -> float:
    """Keyword-only hits should dominate only for explicit document codes."""
    looks_like_code = bool(re.search(r"\b[a-z]{2,}(?:[-/][a-z0-9]+)+\b", query.lower()))
    return 1.15 if looks_like_code else 0.35


def _normalized_text(value: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", value.lower()))


def _meaningful_tokens(value: str) -> set[str]:
    expanded_value = " ".join([value, *_query_expansions(value)])
    return {
        token
        for token in re.findall(r"[a-z0-9]+", expanded_value.lower())
        if token not in STOPWORDS and (len(token) >= 3 or token.isdigit())
    }


def _routing_similarity(query: str, example: str) -> float:
    query_tokens = _meaningful_tokens(query)
    example_tokens = _meaningful_tokens(example)
    overlap = 0.0
    if query_tokens and example_tokens:
        overlap = len(query_tokens & example_tokens) / min(len(query_tokens), len(example_tokens))
    sequence = SequenceMatcher(None, _normalized_text(query), _normalized_text(example)).ratio()
    return max(overlap, sequence)


def _approved_route_documents(engine, query, document_type, evaluation_file, limit=3):
    if not evaluation_file or not Path(evaluation_file).is_file():
        return []
    try:
        cases = json.loads(Path(evaluation_file).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError, TypeError):
        logger.exception("Unable to read approved chatbot routing rules")
        return []

    candidates = []
    for case in cases:
        if case.get("status") != "passed" or not case.get("useForRouting"):
            continue
        expected_type = case.get("expectedDocumentType") or None
        if document_type and expected_type and expected_type != document_type:
            continue
        if not case.get("expectedDocumentNumber") and not case.get("expectedDocument"):
            continue
        score = _routing_similarity(query, case.get("question", ""))
        if score >= 0.55:
            candidates.append((score, case))
    if not candidates:
        return []

    _, route = max(candidates, key=lambda candidate: candidate[0])
    filters = ["c.name = :collection_name"]
    parameters = {"collection_name": COLLECTION_NAME, "limit": max(1, limit - 1)}
    if route.get("expectedDocumentNumber"):
        filters.append("e.cmetadata->>'document_number' = :document_number")
        parameters["document_number"] = route["expectedDocumentNumber"]
    else:
        filters.append("e.cmetadata->>'document_name' = :document_name")
        parameters["document_name"] = route["expectedDocument"]
    if route.get("expectedDocumentType") == "FORM":
        filters.append("e.cmetadata->>'type_doc' = 'FORM'")
    elif route.get("expectedDocumentType") == "READ":
        filters.append("COALESCE(e.cmetadata->>'type_doc', 'READ') = 'READ'")

    statement = text(
        f"""
        SELECT e.document, e.cmetadata
        FROM langchain_pg_embedding e
        JOIN langchain_pg_collection c ON c.uuid = e.collection_id
        WHERE {' AND '.join(filters)}
        ORDER BY COALESCE((e.cmetadata->>'chunk')::integer, 0)
        LIMIT :limit
        """
    )
    with engine.connect() as connection:
        documents = [
            Document(page_content=row.document, metadata=row.cmetadata or {})
            for row in connection.execute(statement, parameters)
        ]
    if not documents:
        return []

    expected_answer = (route.get("expectedAnswer") or "").strip()
    if expected_answer:
        metadata = dict(documents[0].metadata)
        pages = [int(page) for page in re.findall(r"\d+", route.get("expectedPage") or "")]
        if pages:
            metadata["pages"] = pages
        metadata["chunk"] = "approved-route"
        metadata["approved_route"] = True
        documents.insert(
            0,
            Document(
                page_content=f"Jawaban acuan terverifikasi tim MIS:\n{expected_answer}",
                metadata=metadata,
            ),
        )
    logger.info("Applied approved chatbot route for document %s", route.get("expectedDocumentNumber"))
    return documents[:limit]


def _document_key(document: Document) -> tuple:
    metadata = document.metadata
    return (
        metadata.get("sop_doc_id"),
        metadata.get("source"),
        metadata.get("chunk"),
        tuple(metadata.get("pages", [])),
    )


def _keyword_search(engine, query, department, document_type, limit):
    tsquery = _keyword_tsquery(query)
    if not tsquery:
        return []

    search_vector = """
        setweight(to_tsvector('simple', COALESCE(e.cmetadata->>'document_name', '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(e.cmetadata->>'document_number', '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(e.cmetadata->>'source', '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(e.document, '')), 'B')
    """
    filters = ["c.name = :collection_name", f"({search_vector}) @@ to_tsquery('simple', :tsquery)"]
    parameters = {
        "collection_name": COLLECTION_NAME,
        "tsquery": tsquery,
        "limit": limit,
    }
    if department:
        filters.append("e.cmetadata->>'department' = :department")
        parameters["department"] = department
    if document_type == "FORM":
        filters.append("e.cmetadata->>'type_doc' = 'FORM'")
    elif document_type == "READ":
        filters.append("COALESCE(e.cmetadata->>'type_doc', 'READ') = 'READ'")

    statement = text(
        f"""
        SELECT e.document, e.cmetadata,
               ts_rank_cd(({search_vector}), to_tsquery('simple', :tsquery)) AS keyword_score
        FROM langchain_pg_embedding e
        JOIN langchain_pg_collection c ON c.uuid = e.collection_id
        WHERE {' AND '.join(filters)}
        ORDER BY keyword_score DESC
        LIMIT :limit
        """
    )
    with engine.connect() as connection:
        rows = connection.execute(statement, parameters).mappings()
        return [
            Document(page_content=row["document"], metadata=row["cmetadata"] or {})
            for row in rows
        ]


def _fuse_rankings(vector_documents, keyword_documents, query, limit):
    scores = defaultdict(float)
    documents = {}
    for weight, ranking in ((1.0, vector_documents), (_keyword_weight(query), keyword_documents)):
        for rank, document in enumerate(ranking, start=1):
            key = _document_key(document)
            documents.setdefault(key, document)
            scores[key] += weight / (RRF_K + rank)

    ordered_keys = sorted(scores, key=scores.get, reverse=True)
    return [documents[key] for key in ordered_keys[:limit]]


def hybrid_search(
    vector_store,
    engine,
    query,
    department=None,
    document_type=None,
    evaluation_file=None,
    limit=5,
):
    """Combine semantic retrieval and PostgreSQL full-text retrieval with RRF."""
    candidate_limit = 30 if document_type == "READ" else 20
    metadata_filters = []
    if department:
        metadata_filters.append({"department": {"$eq": department}})
    if document_type == "FORM":
        metadata_filters.append({"type_doc": {"$eq": "FORM"}})

    vector_options = {"k": candidate_limit}
    if len(metadata_filters) == 1:
        vector_options["filter"] = metadata_filters[0]
    elif metadata_filters:
        vector_options["filter"] = {"$and": metadata_filters}

    try:
        vector_documents = vector_store.similarity_search(_semantic_query(query), **vector_options)
        if document_type == "READ":
            vector_documents = [
                document
                for document in vector_documents
                if document.metadata.get("type_doc", "READ") != "FORM"
            ][:20]
    except Exception:
        # Keyword retrieval masih dapat melayani kode/nama dokumen ketika provider dibatasi.
        logger.exception("Vector retrieval failed; using PostgreSQL full-text results only")
        vector_documents = []

    try:
        keyword_documents = _keyword_search(
            engine,
            query=query,
            department=department,
            document_type=document_type,
            limit=20,
        )
    except SQLAlchemyError:
        # Vector retrieval tetap melayani chat jika index/migration keyword belum siap.
        logger.exception("PostgreSQL full-text retrieval failed; using vector results only")
        keyword_documents = []
    fused_documents = _fuse_rankings(vector_documents, keyword_documents, query, limit)
    try:
        routed_documents = _approved_route_documents(
            engine,
            query=query,
            document_type=document_type,
            evaluation_file=evaluation_file,
        )
    except SQLAlchemyError:
        logger.exception("Approved chatbot route failed; using hybrid results only")
        routed_documents = []

    combined_documents = []
    seen = set()
    for document in [*routed_documents, *fused_documents]:
        key = _document_key(document)
        if key in seen:
            continue
        seen.add(key)
        combined_documents.append(document)
    return combined_documents[:limit]
