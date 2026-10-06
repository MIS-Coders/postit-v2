import os
from pathlib import Path
from threading import Lock, Thread
from uuid import uuid4

from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_voyageai import VoyageAIEmbeddings
from langchain_postgres.vectorstores import PGVector
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from sqlalchemy import create_engine, text

from embed_service import embed_pdf

load_dotenv()
app = Flask(__name__)
CORS(app)

# 1. Initialize Models and Database Connection
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY is missing!")

# embeddings = GoogleGenerativeAIEmbeddings(
#     model="models/gemini-embedding-001",
#     google_api_key=api_key,
#     output_dimensionality=768,
# )

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


# 2. Vector Store Connection
connection_string = os.getenv("DATABASE_URL")
if not connection_string:
    raise ValueError("DATABASE_URL is missing!")

vector_store = PGVector(
    embeddings=embeddings,
    collection_name="sop_ik_documents_voyage",
    connection=connection_string,
    use_jsonb=True,
)

job_engine = create_engine(connection_string)
embed_lock = Lock()
upload_directory = Path(os.getenv("SOP_UPLOAD_DIR", "/app/uploads"))

# 3. LLM and prompt setup
llm = ChatGoogleGenerativeAI(model='gemini-3.1-flash-lite', google_api_key=api_key, temperature=0.2)


def valid_service_token():
    auth_header = request.headers.get("Authorization")
    super_secret = os.getenv("APP_SECRET_TOKEN")
    return bool(auth_header and super_secret and auth_header == f"Bearer {super_secret}")


def update_embed_job(job_id, status, message, chunks=None):
    with job_engine.begin() as connection:
        connection.execute(
            text(
                """
                UPDATE embedding_job
                SET status = :status, message = :message, chunks = :chunks, updated_at = now()
                WHERE id = :id
                """
            ),
            {"id": job_id, "status": status, "message": message, "chunks": chunks},
        )


def run_embed_job(job_id, filename, document_id, department):
    try:
        # Voyage punya batas token per menit; satu job pada satu waktu menjaga hasil stabil.
        with embed_lock:
            update_embed_job(job_id, "processing", "Membaca PDF dan membuat potongan teks…")
            chunks = embed_pdf(
                vector_store=vector_store,
                connection_string=connection_string,
                file_path=str(upload_directory / filename),
                source=f"sop/{document_id}/{filename}",
                department=department,
                document_id=document_id,
            )
            update_embed_job(job_id, "completed", "Embedding selesai.", chunks)
    except Exception as exc:
        app.logger.exception("Embed job %s failed", job_id)
        update_embed_job(job_id, "failed", str(exc)[:500])


@app.route("/api/embed/jobs", methods=["POST"])
def start_embed_job():
    if not valid_service_token():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    filename = data.get("filename")
    document_id = data.get("documentId")
    department = data.get("department")

    if (
        not isinstance(filename, str)
        or Path(filename).name != filename
        or not filename.lower().endswith(".pdf")
        or not isinstance(document_id, int)
        or document_id <= 0
        or not isinstance(department, str)
        or not department.strip()
    ):
        return jsonify({"error": "Data job embed tidak valid."}), 400

    if not (upload_directory / filename).is_file():
        return jsonify({"error": "File PDF tidak ditemukan."}), 404

    job_id = str(uuid4())
    with job_engine.begin() as connection:
        connection.execute(
            text(
                """
                INSERT INTO embedding_job (id, document_id, status, message)
                VALUES (:id, :document_id, 'queued', 'Menunggu antrean embedding…')
                """
            ),
            {"id": job_id, "document_id": document_id},
        )

    Thread(target=run_embed_job, args=(job_id, filename, document_id, department), daemon=True).start()
    return jsonify({"id": job_id, "status": "queued", "message": "Menunggu antrean embedding…"}), 202


@app.route("/api/embed/jobs/<job_id>", methods=["GET"])
def get_embed_job(job_id):
    if not valid_service_token():
        return jsonify({"error": "Unauthorized"}), 401

    with job_engine.connect() as connection:
        row = connection.execute(
            text("SELECT id, status, message, chunks FROM embedding_job WHERE id = :id"), {"id": job_id}
        ).mappings().first()

    if not row:
        return jsonify({"error": "Job embedding tidak ditemukan."}), 404
    return jsonify(dict(row))

def format_docs(docs):
    """Formats retrieved chunks with clear source, department, and page metadata."""
    formatted = []
    for doc in docs:
        source = doc.metadata.get("source", "Unknown")
        dept = doc.metadata.get("department", "General")
        pages = doc.metadata.get("pages", [])
        page_str = f"Hal. {', '.join(map(str, pages))}" if pages else "Hal. N/A"
        
        header = f"--- [Sumber: {source} | Dept: {dept} | {page_str}] ---"
        formatted.append(f"{header}\n{doc.page_content}")
    return "\n\n".join(formatted)

# ============================================================
# 4. Chat Endpoint
# ============================================================
@app.route("/api/chat", methods=["POST"])
def chat():
    # Bearer token check 
    if not valid_service_token():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    user_query = data.get("query")
    department_filter = data.get("department")  # Optional metadata filter
    
    chat_mode = data.get("mode", "explain")
    
    if not user_query:
        return jsonify({"error": "Query is required"}), 400
    
    # Mapping Departement
    DEPARTMENT_MAPPING = {
        "HCM": "HCM - Human Capital Management",
        "MIS": "MIS - Management Information System"
    }
    
    # "All" berarti tidak menggunakan filter department
    if department_filter == "All":
        department_filter = None

    # Build search parameters with optional metadata filtering, fetch the top 3 most relevant text chunks
    search_kwargs = {"k": 3}
    if department_filter:
        db_department_name = DEPARTMENT_MAPPING.get(department_filter, department_filter)
        search_kwargs["filter"] = {"department": db_department_name}

    retriever = vector_store.as_retriever(search_kwargs=search_kwargs)
    
    # define chat mode
    if chat_mode == "reference":
        system_prompt = (
            "Anda adalah asisten pencari referensi SOP dan IK.\n"
            "Tugas Anda HANYA mencari dan menyebutkan Nama Dokumen, Departemen, dan Nomor Halaman yang terkait dengan pertanyaan pengguna.\n"
            "DILARANG KERAS menjelaskan, merangkum, atau menjabarkan isi atau langkah-langkah dari dokumen tersebut. Cukup berikan referensi lokasinya saja dalam bentuk poin-poin singkat.\n"
            "Jika informasi tidak ditemukan, katakan 'Referensi tidak ditemukan.'\n\n"
            "Konteks Dokumen:\n{context}"
        )
    else:
        system_prompt = (
            "Anda adalah asisten virtual SOP (Standard Operating Procedure) dan IK (Instruksi Kerja).\n"
            "Jawablah pertanyaan pengguna secara akurat berdasarkan konteks dokumen yang diberikan.\n"
            "Jika informasi tidak ditemukan dalam konteks, katakan dengan jelas bahwa Anda tidak menemukan jawabannya di dokumen SOP/IK.\n"
            "Sebutkan nama dokumen sumber (source), departemen, dan nomor halaman jika tersedia dalam konteks.\n\n"
            "Konteks Dokumen:\n{context}"
        )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{question}"),
    ])
    
    # Construct the RAG Chain
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
    )

    def generate():
        for chunk in rag_chain.stream(user_query):
            # 1. Extract the actual text string from the chunk
            text_value = ""
            
            if isinstance(chunk.content, str):
                text_value = chunk.content
            elif isinstance(chunk.content, list):
                # If it's a list of blocks, combine the text fields
                for block in chunk.content:
                    if isinstance(block, dict) and 'text' in block:
                        text_value += block['text']
                        
            # 2. Encode the string to bytes before yielding
            if text_value:
                yield text_value.encode('utf-8')

    return Response(generate(), mimetype="text/plain; charset=utf-8")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3018)
