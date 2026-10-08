import logging
import re
from collections import defaultdict

from langchain_core.documents import Document
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError


COLLECTION_NAME = "sop_ik_documents_voyage"
RRF_K = 60
logger = logging.getLogger(__name__)
STOPWORDS = {
    "ada",
    "adalah",
    "apa",
    "apakah",
    "atau",
    "bagaimana",
    "buat",
    "dalam",
    "dan",
    "dari",
    "dengan",
    "di",
    "dokumen",
    "form",
    "formulir",
    "ik",
    "ini",
    "itu",
    "ke",
    "mana",
    "mengenai",
    "nomor",
    "pada",
    "saya",
    "siapa",
    "sop",
    "tentang",
    "untuk",
    "yang",
}


def _keyword_tsquery(query: str) -> str | None:
    """Build a safe OR query from meaningful words, document codes, and numbers."""
    tokens = []
    for token in re.findall(r"[a-z0-9]+", query.lower()):
        if token in STOPWORDS:
            continue
        if len(token) < 3 and not token.isdigit():
            continue
        if token not in tokens:
            tokens.append(token)
    return " | ".join(f"{token}:*" for token in tokens[:12]) or None


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


def _fuse_rankings(vector_documents, keyword_documents, limit):
    scores = defaultdict(float)
    documents = {}
    for weight, ranking in ((1.0, vector_documents), (1.15, keyword_documents)):
        for rank, document in enumerate(ranking, start=1):
            key = _document_key(document)
            documents.setdefault(key, document)
            scores[key] += weight / (RRF_K + rank)

    ordered_keys = sorted(scores, key=scores.get, reverse=True)
    return [documents[key] for key in ordered_keys[:limit]]


def hybrid_search(vector_store, engine, query, department=None, document_type=None, limit=5):
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
        vector_documents = vector_store.similarity_search(query, **vector_options)
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
    return _fuse_rankings(vector_documents, keyword_documents, limit)
