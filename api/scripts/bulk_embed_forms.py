"""Embed FORM documents from sop-data.json in a controlled, resumable batch.

Default mode only previews 10 documents. Use --apply to write vectors.
Use --all only after the 10-document test has been verified.
"""

import argparse
import json
import os
from pathlib import Path
import sys
from tempfile import NamedTemporaryFile

from dotenv import load_dotenv
from langchain_postgres.vectorstores import PGVector
from langchain_voyageai import VoyageAIEmbeddings
from sqlalchemy import create_engine, text

sys.path.append(str(Path(__file__).resolve().parents[1]))
from embed_service import EmbeddingRateLimiter, embed_pdf


COLLECTION_NAME = "sop_ik_documents_voyage"


def parse_args():
    parser = argparse.ArgumentParser(description="Bulk embed PDF Formulir PostIt.")
    parser.add_argument("--metadata", type=Path, required=True, help="Path sop-data.json")
    parser.add_argument("--pdf-dir", type=Path, default=Path("/app/uploads"), help="Folder PDF Formulir")
    parser.add_argument("--limit", type=int, default=10, help="Jumlah dokumen untuk diproses (default: 10)")
    parser.add_argument("--all", action="store_true", help="Proses semua Formulir; gunakan setelah test berhasil")
    parser.add_argument("--apply", action="store_true", help="Tulis embedding ke database")
    parser.add_argument("--requests-per-minute", type=int, default=3, help="Batas request Voyage per menit (default: 3)")
    parser.add_argument("--tokens-per-minute", type=int, default=9_000, help="Batas token aman per menit (default: 9000)")
    parser.add_argument("--state-file", type=Path, default=Path("/tmp/postit-form-embed-state.json"), help="Checkpoint dokumen yang selesai")
    parser.add_argument("--bootstrap-ids", default="", help="ID dokumen yang sudah dipastikan selesai dari test sebelumnya, dipisah koma")
    return parser.parse_args()


def load_form_documents(metadata_path: Path, pdf_dir: Path):
    data = json.loads(metadata_path.read_text(encoding="utf-8"))
    departments = {
        department["id"]: department["nama_departement"]
        for department in data.get("departement", [])
    }
    documents = []
    missing_files = []
    root = pdf_dir.resolve()

    for document in sorted(data.get("sopdoc", []), key=lambda item: item["id"]):
        if document.get("type_doc") != "FORM":
            continue

        filename = document.get("file")
        if not filename:
            missing_files.append(f"ID {document['id']} tidak memiliki nama file")
            continue

        pdf_path = (root / filename).resolve()
        if pdf_path.parent != root or not pdf_path.is_file():
            missing_files.append(f"ID {document['id']}: {filename}")
            continue

        documents.append(
            {
                "id": document["id"],
                "source": filename,
                "pdf_path": pdf_path,
                "department": departments.get(document.get("departement_id"), "Tanpa Departemen"),
            }
        )

    return documents, missing_files


def create_vector_store():
    api_key = os.getenv("VOYAGE_API_KEY")
    database_url = os.getenv("DATABASE_URL")
    if not api_key:
        raise ValueError("VOYAGE_API_KEY belum tersedia.")
    if not database_url:
        raise ValueError("DATABASE_URL belum tersedia.")

    embeddings = VoyageAIEmbeddings(
        model="voyage-4-large",
        voyage_api_key=api_key,
        output_dimension=1024,
    )
    return PGVector(
        embeddings=embeddings,
        collection_name=COLLECTION_NAME,
        connection=database_url,
        use_jsonb=True,
    ), database_url


def load_state(state_file: Path):
    if not state_file.is_file():
        return set()
    data = json.loads(state_file.read_text(encoding="utf-8"))
    return {int(document_id) for document_id in data.get("completed_document_ids", [])}


def save_state(state_file: Path, completed_document_ids):
    state_file.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps({"completed_document_ids": sorted(completed_document_ids)}, indent=2) + "\n"
    with NamedTemporaryFile("w", encoding="utf-8", dir=state_file.parent, delete=False) as temporary:
        temporary.write(payload)
        temporary_path = Path(temporary.name)
    temporary_path.replace(state_file)


def existing_form_embedding_ids(engine, completed_only=True):
    with engine.connect() as connection:
        results = connection.execute(
            text(
                """
                SELECT DISTINCT e.cmetadata->>'sop_doc_id' AS document_id
                FROM langchain_pg_embedding e
                JOIN langchain_pg_collection c ON e.collection_id = c.uuid
                WHERE c.name = :collection_name
                  AND e.cmetadata->>'type_doc' = 'FORM'
                  AND e.cmetadata->>'sop_doc_id' IS NOT NULL
                  AND (:completed_only = false OR e.cmetadata->>'bulk_embed_complete' = 'true')
                """
            ),
            {"collection_name": COLLECTION_NAME, "completed_only": completed_only},
        )
        return {int(row.document_id) for row in results}


def mark_form_embedding_complete(engine, document_id: int):
    with engine.begin() as connection:
        result = connection.execute(
            text(
                """
                UPDATE langchain_pg_embedding e
                SET cmetadata = jsonb_set(e.cmetadata, '{bulk_embed_complete}', 'true'::jsonb)
                FROM langchain_pg_collection c
                WHERE e.collection_id = c.uuid
                  AND c.name = :collection_name
                  AND e.cmetadata->>'type_doc' = 'FORM'
                  AND e.cmetadata->>'sop_doc_id' = :document_id
                """
            ),
            {"collection_name": COLLECTION_NAME, "document_id": str(document_id)},
        )
        if result.rowcount < 1:
            raise RuntimeError(f"Embedding dokumen ID {document_id} tidak ditemukan di database.")


def main():
    load_dotenv()
    args = parse_args()
    if args.limit < 1:
        raise ValueError("--limit harus minimal 1.")

    documents, missing_files = load_form_documents(args.metadata, args.pdf_dir)
    selected = documents if args.all else documents[: args.limit]

    print(f"Total Formulir dengan PDF tersedia: {len(documents)}")
    print(f"PDF mapping tidak ditemukan: {len(missing_files)}")
    print(f"Dokumen yang dipilih: {len(selected)}")
    if missing_files:
        print("Contoh mapping yang tidak ditemukan:")
        for entry in missing_files[:10]:
            print(f"- {entry}")

    if not args.apply:
        print("Dry run selesai. Tambahkan --apply untuk mulai embedding.")
        return

    vector_store, database_url = create_vector_store()
    engine = create_engine(database_url)
    completed_document_ids = load_state(args.state_file)
    completed_document_ids.update(existing_form_embedding_ids(engine))
    if args.bootstrap_ids:
        bootstrap_ids = {int(value.strip()) for value in args.bootstrap_ids.split(",")}
        available_ids = existing_form_embedding_ids(engine, completed_only=False)
        missing_ids = bootstrap_ids - available_ids
        if missing_ids:
            raise ValueError(f"ID tidak punya embedding FORM: {sorted(missing_ids)}")
        for document_id in sorted(bootstrap_ids):
            mark_form_embedding_complete(engine, document_id)
        completed_document_ids.update(bootstrap_ids)
        save_state(args.state_file, completed_document_ids)

    pending = [document for document in selected if document["id"] not in completed_document_ids]
    print(f"Sudah selesai dari checkpoint: {len(selected) - len(pending)}")
    total_chunks = 0
    failures = []
    max_batch_tokens = args.tokens_per_minute // args.requests_per_minute
    rate_limiter = EmbeddingRateLimiter(
        requests_per_minute=args.requests_per_minute,
        tokens_per_minute=args.tokens_per_minute,
    )

    for index, document in enumerate(pending, start=1):
        print(f"[{index}/{len(pending)}] Embedding dokumen ID {document['id']}: {document['source']}")
        try:
            chunks = embed_pdf(
                vector_store=vector_store,
                connection_string=database_url,
                file_path=str(document["pdf_path"]),
                source=document["source"],
                department=document["department"],
                document_id=document["id"],
                document_type="FORM",
                max_batch_tokens=max_batch_tokens,
                add_documents=lambda batch, token_count: rate_limiter.add_documents(vector_store, batch, token_count),
            )
            mark_form_embedding_complete(engine, document["id"])
            total_chunks += chunks
            completed_document_ids.add(document["id"])
            save_state(args.state_file, completed_document_ids)
        except Exception as error:
            failures.append((document["id"], str(error)))
            print(f"  Gagal: {error}")

    print(f"Selesai. Chunk tersimpan: {total_chunks}. Gagal: {len(failures)}.")
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
