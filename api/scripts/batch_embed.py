import os
import hashlib

import pymupdf4llm

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_postgres.vectorstores import PGVector
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


# Load environment variables
load_dotenv()


# ============================================================
# 1. Initialize Gemini Embeddings
# ============================================================

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY belum tersedia!")

embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-001",
    google_api_key=api_key,
    output_dimensionality=768
)


# ============================================================
# 2. PostgreSQL connection
# ============================================================

connection_string = os.getenv("DATABASE_URL")

if not connection_string:
    raise ValueError("DATABASE_URL belum tersedia!")


# ============================================================
# 3. Initialize PGVector
# ============================================================

vector_store = PGVector(
    embeddings=embeddings,
    collection_name="legacy_documents",
    connection=connection_string,
    use_jsonb=True,
)


# ============================================================
# 4. Text splitter
# ============================================================

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)


# ============================================================
# 5. Calculate SHA-256 file hash
# ============================================================

def calculate_file_hash(file_path: str) -> str:
    """
    Menghitung SHA-256 hash berdasarkan isi file.
    """

    sha256 = hashlib.sha256()

    with open(file_path, "rb") as file:

        while chunk := file.read(8192):
            sha256.update(chunk)

    return sha256.hexdigest()


# ============================================================
# 6. Get existing files from PostgreSQL
# ============================================================

def get_existing_files():
    """
    Mengambil source dan file_hash dari embedding
    yang sudah tersimpan di collection legacy_documents.
    """

    engine = create_engine(connection_string)

    query = text("""
        SELECT DISTINCT
            cmetadata->>'source' AS source,
            cmetadata->>'file_hash' AS file_hash
        FROM langchain_pg_embedding
        WHERE cmetadata->>'source' IS NOT NULL
    """)

    existing_files = {}

    with engine.connect() as connection:

        results = connection.execute(query)

        for row in results:

            source = row.source
            file_hash = row.file_hash

            if source:
                existing_files[source] = file_hash

    return existing_files


# ============================================================
# 7. Delete old embeddings for a file
# ============================================================

def delete_file_embeddings(source: str):
    """
    Menghapus seluruh chunk/embedding lama berdasarkan source.
    Digunakan ketika file yang sama telah berubah.
    """

    engine = create_engine(connection_string)

    query = text("""
        DELETE FROM langchain_pg_embedding
        WHERE cmetadata->>'source' = :source
    """)

    with engine.begin() as connection:

        result = connection.execute(
            query,
            {"source": source}
        )

    print(
        f"Deleted {result.rowcount} old chunks "
        f"for: {source}"
    )


# ============================================================
# 8. Process PDF files
# ============================================================

def migrate_pdfs(pdf_directory: str):

    existing_files = get_existing_files()

    print(
        f"Existing processed files: "
        f"{len(existing_files)}"
    )

    total_new_chunks = 0

    # Iterate through PDF files
    for filename in os.listdir(pdf_directory):

        if not filename.lower().endswith(".pdf"):
            continue

        file_path = os.path.join(
            pdf_directory,
            filename
        )

        print()
        print(f"Checking: {filename}")

        # Calculate current file hash
        current_hash = calculate_file_hash(
            file_path
        )

        # ====================================================
        # Case 1: File already exists
        # ====================================================

        if filename in existing_files:

            old_hash = existing_files[filename]

            # Same filename + same hash
            if old_hash == current_hash:

                print(
                    f"Skipping "
                    f"(already processed): {filename}"
                )

                continue

            # Same filename + different hash
            else:

                print(
                    f"File changed, re-processing: "
                    f"{filename}"
                )

                delete_file_embeddings(filename)

        # ====================================================
        # Case 2: New file
        # ====================================================

        else:

            print(
                f"New file detected: {filename}"
            )

        # ====================================================
        # Extract PDF
        # ====================================================

        print(
            f"Processing: {filename}"
        )

        markdown_content = pymupdf4llm.to_markdown(
            file_path
        )

        # ====================================================
        # Split document into chunks
        # ====================================================

        chunks = text_splitter.split_text(
            markdown_content
        )

        print(
            f"Created {len(chunks)} chunks"
        )

        # ====================================================
        # Create LangChain Documents
        # ====================================================

        docs_to_insert = []

        for index, chunk in enumerate(chunks):

            doc = Document(
                page_content=chunk,
                metadata={
                    "source": filename,
                    "file_hash": current_hash,
                    "type": "legacy_migration",
                    "chunk": index
                }
            )

            docs_to_insert.append(doc)

        # ====================================================
        # Insert embeddings
        # ====================================================

        if docs_to_insert:

            vector_store.add_documents(
                docs_to_insert
            )

            total_new_chunks += len(
                docs_to_insert
            )

            print(
                f"Successfully embedded "
                f"{len(docs_to_insert)} chunks"
            )

    # ========================================================
    # Summary
    # ========================================================

    print()
    print("=" * 60)
    print(
        f"Migration completed. "
        f"Total chunks inserted: {total_new_chunks}"
    )
    print("=" * 60)


# ============================================================
# 9. Main
# ============================================================

if __name__ == "__main__":

    migrate_pdfs("./uploads")