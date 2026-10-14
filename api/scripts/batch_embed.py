import os
import hashlib
import time

import pymupdf4llm

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from transformers import AutoTokenizer

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_voyageai import VoyageAIEmbeddings
from langchain_postgres.vectorstores import PGVector
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


# Load environment variables
load_dotenv()


# ============================================================
# 1. Initialize Gemini Embeddings
# ============================================================

# api_key = os.getenv("GEMINI_API_KEY")

# if not api_key:
#     raise ValueError("GEMINI_API_KEY belum tersedia!")

# embeddings = GoogleGenerativeAIEmbeddings(
#     model="gemini-embedding-001",
#     google_api_key=api_key,
#     output_dimensionality=768,
# )

# ============================================================
# 1. Initialize Voyage Embeddings
# ============================================================
voyage_api_key = os.getenv("VOYAGE_API_KEY")

if not voyage_api_key:
    raise ValueError(
        "VOYAGE_API_KEY belum tersedia!"
    )

embeddings = VoyageAIEmbeddings(
    model="voyage-4-large",
    voyage_api_key=voyage_api_key,
    output_dimension=1024,
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
    collection_name="sop_ik_documents_voyage",
    connection=connection_string,
    use_jsonb=True,
)


# ============================================================
# 4. Text splitter
# ============================================================

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)

def analyze_chunks(docs):
    """
    Mengukur jumlah token aktual setiap chunk
    menggunakan tokenizer Voyage-4-Large.
    """

    tokenizer = AutoTokenizer.from_pretrained(
        "voyageai/voyage-4-large"
    )

    token_counts = []

    for doc in docs:
        tokens = tokenizer.encode(
            doc.page_content,
            add_special_tokens=False,
        )

        token_counts.append(len(tokens))

    if not token_counts:
        print("Tidak ada chunk untuk dianalisis.")
        return

    total_tokens = sum(token_counts)

    print()
    print("=" * 60)
    print("CHUNK TOKEN ANALYSIS")
    print("=" * 60)

    print(f"Total chunks   : {len(token_counts)}")
    print(f"Total tokens   : {total_tokens:,}")
    print(
        f"Average tokens : "
        f"{total_tokens / len(token_counts):.2f}"
    )
    print(f"Minimum tokens : {min(token_counts)}")
    print(f"Maximum tokens : {max(token_counts)}")

    print("=" * 60)

    print()
    print("10 LARGEST CHUNKS")
    print("-" * 60)

    largest = sorted(
        enumerate(token_counts),
        key=lambda x: x[1],
        reverse=True,
    )[:10]

    for index, count in largest:
        print(
            f"Chunk {index:4d} : "
            f"{count:,} tokens"
        )

    print("=" * 60)

    return token_counts

# ============================================================
# Count Tokens
# ============================================================
tokenizer = AutoTokenizer.from_pretrained(
    "voyageai/voyage-4-large"
)

def count_tokens(text: str) -> int:
    return len(
        tokenizer.encode(
            text,
            add_special_tokens=False,
        )
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
# 6. Get department from subfolder
# ============================================================

def get_department(root_directory: str, file_path: str) -> str:
    """
    Mengambil nama subfolder langsung di bawah root directory
    sebagai department.

    Contoh:

        uploads/
        ├── HR/
        │   └── SOP.pdf
        └── IT/
            └── SOP.pdf

    Maka:

        uploads/HR/SOP.pdf -> HR
        uploads/IT/SOP.pdf -> IT
    """

    root_directory = os.path.abspath(root_directory)
    file_path = os.path.abspath(file_path)

    relative_path = os.path.relpath(
        file_path,
        root_directory,
    )

    path_parts = relative_path.split(os.sep)

    # Minimal:
    # department/file.pdf
    if len(path_parts) < 2:
        raise ValueError(
            f"File harus berada di dalam subfolder department: "
            f"{file_path}"
        )

    department = path_parts[0]

    return department


# ============================================================
# 7. Get existing files from PostgreSQL
# ============================================================

def get_existing_files():
    """
    Mengambil source, file_hash, dan department dari embedding
    yang sudah tersimpan.

    Source menggunakan relative path, misalnya:

        HR/SOP.pdf
        IT/SOP.pdf

    sehingga file dengan nama sama tetapi department berbeda
    tidak dianggap sebagai file yang sama.
    """
    COLLECTION_NAME = "sop_ik_documents_voyage"
    
    engine = create_engine(connection_string)

    query = text("""
        SELECT DISTINCT
            e.cmetadata->>'source' AS source,
            e.cmetadata->>'file_hash' AS file_hash,
            e.cmetadata->>'department' AS department
        FROM langchain_pg_embedding e
        JOIN langchain_pg_collection c ON e.collection_id = c.uuid
        WHERE c.name = :collection_name AND e.cmetadata->>'source' IS NOT NULL
    """)

    existing_files = {}

    with engine.connect() as connection:
        results = connection.execute(
            query,
            {"collection_name": COLLECTION_NAME}
        )

        for row in results:
            source = row.source
            file_hash = row.file_hash

            if source:
                existing_files[source] = {
                    "file_hash": file_hash,
                    "department": row.department,
                }

    return existing_files


# ============================================================
# 8. Delete old embeddings for a file
# ============================================================

def delete_file_embeddings(source: str):
    """
    Menghapus seluruh chunk/embedding lama berdasarkan source.
    """

    engine = create_engine(connection_string)

    query = text("""
        DELETE FROM langchain_pg_embedding e 
        USING langchain_pg_collection c
        WHERE e.collection_id = c.uuid
        AND c.name = :collection_name
        AND e.cmetadata->>'source' = :source
    """)

    with engine.begin() as connection:
        result = connection.execute(
            query,
            {
                "collection_name": "sop_ik_documents_voyage",
                "source": source,
            },
        )

    print(
        f"Deleted {result.rowcount} old chunks "
        f"for: {source}"
    )

# ============================================================
# Token Aware Batching
# ============================================================
TPM_LIMIT = 10_000
SAFE_TPM_LIMIT = 9_000
RATE_LIMIT_WINDOW = 60  # seconds

def create_token_batches(docs, max_tokens=SAFE_TPM_LIMIT):
    batches = []
    current_batch = []
    current_tokens = 0

    for doc in docs:

        token_count = count_tokens(
            doc.page_content
        )

        # Satu chunk sendiri terlalu besar
        if token_count > max_tokens:
            raise ValueError(
                f"Chunk terlalu besar: "
                f"{token_count:,} tokens"
            )

        if (
            current_batch
            and current_tokens + token_count > max_tokens
        ):
            batches.append(
                (current_batch, current_tokens)
            )

            current_batch = []
            current_tokens = 0

        current_batch.append(doc)
        current_tokens += token_count

    if current_batch:
        batches.append((current_batch, current_tokens))

    return batches

# ============================================================
# Embedding per batch
# ============================================================
def embed_documents_in_batches(docs):
    batches = create_token_batches(docs)

    print()
    print("=" * 60)
    print("TOKEN-AWARE EMBEDDING")
    print("=" * 60)

    print(
        f"Total chunks : {len(docs)}"
    )

    print(
        f"Total batches: {len(batches)}"
    )

    print(
        f"Safe TPM     : {SAFE_TPM_LIMIT:,}"
    )

    print("=" * 60)

    for batch_index, (
        batch_docs,
        batch_tokens,
    ) in enumerate(batches, start=1):

        print()
        print(
            f"Batch {batch_index}/{len(batches)}"
        )

        print(
            f"Chunks : {len(batch_docs)}"
        )

        print(
            f"Tokens : {batch_tokens:,}"
        )

        print("-" * 60)

        vector_store.add_documents(
            batch_docs
        )

        print(
            f"✓ Batch {batch_index} berhasil "
            f"disimpan ke PostgreSQL."
        )

        print(
            "Menunggu rate-limit window..."
        )

        time.sleep(
            RATE_LIMIT_WINDOW
        )

    print()
    print(
        "✓ Semua batch berhasil di-embed."
    )

# ============================================================
# 9. Process PDF files recursively
# ============================================================

def migrate_pdfs(pdf_directory: str):

    pdf_directory = os.path.abspath(pdf_directory)

    if not os.path.isdir(pdf_directory):
        raise ValueError(
            f"Directory tidak ditemukan: {pdf_directory}"
        )

    existing_files = get_existing_files()

    print(
        f"Existing processed files: "
        f"{len(existing_files)}"
    )

    total_new_chunks = 0

    # ========================================================
    # Walk through all subfolders
    # ========================================================

    for root, dirs, files in os.walk(pdf_directory):

        for filename in files:

            if not filename.lower().endswith(".pdf"):
                continue

            file_path = os.path.join(
                root,
                filename,
            )

            # =================================================
            # Get department from subfolder
            # =================================================

            department = get_department(
                pdf_directory,
                file_path,
            )

            # =================================================
            # Use relative path as source
            # =================================================

            source = os.path.relpath(
                file_path,
                pdf_directory,
            )

            # Normalize path separator
            source = source.replace(os.sep, "/")

            print()
            print("=" * 60)
            print(f"Checking: {source}")
            print(f"Department: {department}")

            # =================================================
            # Calculate current file hash
            # =================================================

            current_hash = calculate_file_hash(
                file_path
            )

            # =================================================
            # Case 1: File already exists
            # =================================================

            if source in existing_files:

                old_hash = existing_files[source]["file_hash"]

                if old_hash == current_hash:

                    print(
                        f"Skipping "
                        f"(already processed): {source}"
                    )

                    continue

                # ------------------------------------------------
                # Same source + different hash
                # ------------------------------------------------

                print(
                    f"File changed, re-processing: "
                    f"{source}"
                )

                delete_file_embeddings(source)

            # =================================================
            # Case 2: New file
            # =================================================

            else:

                print(
                    f"New file detected: {source}"
                )

            # =================================================
            # Extract PDF PER PAGE
            # =================================================

            print(
                f"Processing: {source}"
            )

            page_chunks = pymupdf4llm.to_markdown(
                file_path,
                page_chunks=True,
            )

            print(
                f"Detected {len(page_chunks)} pages"
            )

            # =================================================
            # Create LangChain Documents
            # =================================================

            docs_to_insert = []

            global_chunk_index = 0

            for page_index, page_data in enumerate(
                page_chunks
            ):

                # PyMuPDF page numbering:
                # manusia biasanya menggunakan 1-based index
                page_number = page_index + 1

                # Extract text from current page
                page_text = page_data["text"]

                if not page_text.strip():
                    continue

                # ----------------------------------------------
                # Split current page into chunks
                # ----------------------------------------------

                chunks = text_splitter.split_text(
                    page_text
                )

                for chunk in chunks:

                    doc = Document(
                        page_content=chunk,
                        metadata={
                            # Relative path
                            "source": source,

                            # SHA-256
                            "file_hash": current_hash,

                            # Department from subfolder
                            "department": department,

                            # Global chunk number
                            "chunk": global_chunk_index,

                            # Page number
                            "pages": [page_number],
                        },
                    )

                    docs_to_insert.append(doc)

                    global_chunk_index += 1

            # =================================================
            # Insert embeddings
            # =================================================
            if docs_to_insert:
                # KODE DIBAWAH DAPAT DIAKTIFKAN JIKA INGIN ANALYSIS CHUNK TOKENS
                # analyze_chunks(docs_to_insert)

                # # STOP sementara untuk testing
                # continue
            
                # vector_store.add_documents(
                #     docs_to_insert
                # )
                
                embed_documents_in_batches(docs_to_insert)

                total_new_chunks += len(
                    docs_to_insert
                )

                print(
                    f"Successfully embedded "
                    f"{len(docs_to_insert)} chunks"
                )

            else:

                print(
                    f"No text chunks found: {source}"
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
# 10. Main
# ============================================================

if __name__ == "__main__":

    migrate_pdfs("./uploads")
