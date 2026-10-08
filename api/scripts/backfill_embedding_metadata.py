"""Add document names and numbers to existing vector metadata without re-embedding."""

import argparse
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


COLLECTION_NAME = "sop_ik_documents_voyage"


def parse_args():
    parser = argparse.ArgumentParser(description="Backfill metadata embedding PostIt.")
    parser.add_argument("--metadata", type=Path, required=True, help="Path sop-data.json")
    return parser.parse_args()


def main():
    load_dotenv()
    args = parse_args()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL belum tersedia.")

    data = json.loads(args.metadata.read_text(encoding="utf-8"))
    documents = {
        str(document["id"]): {
            "document_name": document.get("nama_dokumen") or "",
            "document_number": document.get("no_dokumen") or "",
        }
        for document in data.get("sopdoc", [])
    }

    updated_chunks = 0
    matched_documents = 0
    engine = create_engine(database_url)
    with engine.begin() as connection:
        for document_id, metadata in documents.items():
            result = connection.execute(
                text(
                    """
                    UPDATE langchain_pg_embedding e
                    SET cmetadata = e.cmetadata || jsonb_build_object(
                      'document_name', :document_name,
                      'document_number', :document_number
                    )
                    FROM langchain_pg_collection c
                    WHERE e.collection_id = c.uuid
                      AND c.name = :collection_name
                      AND e.cmetadata->>'sop_doc_id' = :document_id
                    """
                ),
                {
                    "collection_name": COLLECTION_NAME,
                    "document_id": document_id,
                    **metadata,
                },
            )
            if result.rowcount:
                matched_documents += 1
                updated_chunks += result.rowcount

    print(f"Metadata diperbarui: {matched_documents} dokumen, {updated_chunks} chunk.")


if __name__ == "__main__":
    main()
