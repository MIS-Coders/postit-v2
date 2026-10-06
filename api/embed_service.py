"""Embed one SOP PDF without touching embeddings from other documents."""

import hashlib
from pathlib import Path

import pymupdf4llm
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy import create_engine, text
from transformers import AutoTokenizer

TEXT_SPLITTER = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
SAFE_TPM_LIMIT = 9_000
_tokenizer = None


def _get_tokenizer():
    global _tokenizer
    if _tokenizer is None:
        _tokenizer = AutoTokenizer.from_pretrained("voyageai/voyage-4-large")
    return _tokenizer


def _file_hash(file_path: Path) -> str:
    digest = hashlib.sha256()
    with file_path.open("rb") as file:
        for block in iter(lambda: file.read(8192), b""):
            digest.update(block)
    return digest.hexdigest()


def _token_batches(documents: list[Document]):
    tokenizer = _get_tokenizer()
    batches: list[list[Document]] = []
    batch: list[Document] = []
    token_total = 0

    for document in documents:
        count = len(tokenizer.encode(document.page_content, add_special_tokens=False))
        if count > SAFE_TPM_LIMIT:
            raise ValueError(f"Satu potongan dokumen terlalu besar ({count} token).")
        if batch and token_total + count > SAFE_TPM_LIMIT:
            batches.append(batch)
            batch, token_total = [], 0
        batch.append(document)
        token_total += count

    if batch:
        batches.append(batch)
    return batches


def _delete_document_embeddings(connection_string: str, document_id: int, file_hash: str) -> None:
    engine = create_engine(connection_string)
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                DELETE FROM langchain_pg_embedding e
                USING langchain_pg_collection c
                WHERE e.collection_id = c.uuid
                  AND c.name = :collection_name
                  AND (
                    e.cmetadata->>'sop_doc_id' = :document_id
                    OR e.cmetadata->>'file_hash' = :file_hash
                  )
                """
            ),
            {
                "collection_name": "sop_ik_documents_voyage",
                "document_id": str(document_id),
                "file_hash": file_hash,
            },
        )


def embed_pdf(vector_store, connection_string: str, file_path: str, source: str, department: str, document_id: int) -> int:
    """Replace only this document's chunks, then store freshly generated embeddings."""
    pdf = Path(file_path)
    if not pdf.is_file():
        raise FileNotFoundError("File PDF tidak ditemukan di penyimpanan.")

    file_hash = _file_hash(pdf)
    page_chunks = pymupdf4llm.to_markdown(str(pdf), page_chunks=True)
    documents: list[Document] = []
    chunk_number = 0

    for page_number, page in enumerate(page_chunks, start=1):
        page_text = page.get("text", "")
        if not page_text.strip():
            continue
        for chunk in TEXT_SPLITTER.split_text(page_text):
            documents.append(
                Document(
                    page_content=chunk,
                    metadata={
                        "source": source,
                        "file_hash": file_hash,
                        "department": department,
                        "sop_doc_id": str(document_id),
                        "chunk": chunk_number,
                        "pages": [page_number],
                    },
                )
            )
            chunk_number += 1

    if not documents:
        raise ValueError("PDF tidak memiliki teks yang dapat di-embed.")

    # ID dokumen pada metadata membuat re-embed hanya mengganti chunk PDF ini.
    _delete_document_embeddings(connection_string, document_id, file_hash)
    for batch in _token_batches(documents):
        vector_store.add_documents(batch)

    return len(documents)
