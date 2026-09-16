import os

import pymupdf4llm

from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_postgres.vectorstores import PGVector
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Load environment variables
load_dotenv()

# 1. Initialize Gemini Embeddings
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY belum tersedia!")

embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-001",
    google_api_key=api_key,
    output_dimensionality=768
)

# 2. PostgreSQL connection
connection_string = os.getenv("DATABASE_URL")

if not connection_string:
    raise ValueError("DATABASE_URL belum tersedia!")

# 3. Initialize PGVector
vector_store = PGVector(
    embeddings=embeddings,
    collection_name="legacy_documents",
    connection=connection_string,
    use_jsonb=True,
)

# 4. Text splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)


def migrate_pdfs(pdf_directory: str):

    docs_to_insert = []

    # Iterate through PDF files
    for filename in os.listdir(pdf_directory):

        if filename.lower().endswith(".pdf"):

            file_path = os.path.join(pdf_directory, filename)

            print(f"Processing: {filename}")

            # Extract PDF content into Markdown
            markdown_content = pymupdf4llm.to_markdown(file_path)

            # Split document into smaller chunks
            chunks = text_splitter.split_text(markdown_content)

            # Create LangChain Documents
            for index, chunk in enumerate(chunks):

                doc = Document(
                    page_content=chunk,
                    metadata={
                        "source": filename,
                        "type": "legacy_migration",
                        "chunk": index
                    }
                )

                docs_to_insert.append(doc)

    # Insert embeddings into PGVector
    if docs_to_insert:

        vector_store.add_documents(docs_to_insert)

        print(
            f"Successfully migrated "
            f"{len(docs_to_insert)} chunks."
        )

    else:

        print("Tidak ada file PDF yang ditemukan.")


if __name__ == "__main__":

    migrate_pdfs("./uploads")