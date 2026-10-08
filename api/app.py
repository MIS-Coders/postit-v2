import json
import os
import re
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
    """Formats retrieved chunks with clear type, source, department, and page metadata."""
    formatted = []
    for doc in docs:
        source = doc.metadata.get("source", "Unknown")
        dept = doc.metadata.get("department", "General")
        document_type = doc.metadata.get("type_doc", "READ")
        type_label = "Formulir" if document_type == "FORM" else "SOP/IK"
        pages = doc.metadata.get("pages", [])
        page_str = f"Hal. {', '.join(map(str, pages))}" if pages else "Hal. N/A"
        
        header = f"--- [Jenis: {type_label} | Sumber: {source} | Dept: {dept} | {page_str}] ---"
        formatted.append(f"{header}\n{doc.page_content}")
    return "\n\n".join(formatted)


def collect_sources(docs):
    """Daftar dokumen sumber (unik) beserta halamannya, dikirim ke web untuk dibuatkan link."""
    sources = {}
    for doc in docs:
        source = doc.metadata.get("source")
        if not source:
            continue
        entry = sources.setdefault(
            source,
            {
                "source": source,
                "department": doc.metadata.get("department"),
                "sop_doc_id": doc.metadata.get("sop_doc_id"),
                "type_doc": doc.metadata.get("type_doc", "READ"),
                "pages": [],
            },
        )
        for page in doc.metadata.get("pages", []):
            if page not in entry["pages"]:
                entry["pages"].append(page)
    for entry in sources.values():
        entry["pages"].sort()
    return list(sources.values())


def requested_document_type(data, query):
    """Resolve an explicit UI context first, then apply the company's document terminology."""
    explicit_type = data.get("documentType") or data.get("document_type")
    if explicit_type in {"READ", "FORM"}:
        return explicit_type

    normalized_query = query.lower()
    if re.search(r"\bsop\s+formulir\b", normalized_query):
        return "FORM"
    if (
        re.search(r"\bsop\b", normalized_query)
        or re.search(r"\bik\b", normalized_query)
        or "instruksi kerja" in normalized_query
    ):
        return "READ"
    if (
        re.search(r"\bformulir\b", normalized_query)
        or re.search(r"\bform\b", normalized_query)
        or re.search(r"\bdokumen\b", normalized_query)
    ):
        return "FORM"
    return None


def is_creator_question(query):
    """Answer app-credit questions without sending an unrelated query to document retrieval."""
    normalized_query = query.lower()
    product_terms = ("web", "website", "aplikasi", "postit", "chatbot", "sistem ini")
    asks_creator = bool(
        re.search(
            r"siapa.*(?:buat|bikin|pembuat|developer|pengembang)|"
            r"(?:dibuat|dibikin|dikembangkan).*siapa|siapa.*(?:di balik|dibalik)",
            normalized_query,
        )
    )
    return asks_creator and any(term in normalized_query for term in product_terms)

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
    document_type = requested_document_type(data, user_query) if isinstance(user_query, str) else None
    
    chat_mode = data.get("mode", "explain")
    
    if not user_query:
        return jsonify({"error": "Query is required"}), 400

    if is_creator_question(user_query):
        response = Response(
            "Web PostIt ini dibuat oleh [Wahyu](https://wonder-kid.site) dan Alwin dari tim MIS.",
            mimetype="text/plain; charset=utf-8",
        )
        response.headers["X-Chat-Sources"] = "[]"
        return response
    
    # Mapping Departement
    DEPARTMENT_MAPPING = {
        "MH": "MH - Material Handling",
        "MIS": "MIS - Management Information System",
        "ACC & TAX": "ACC & TAX - Accounting & TAX",
        "HCM": "HCM - Human Capital Management",
        "FNC": "FNC - Finance",
        "SSL": "SSL- Social, Secure & License",
        "ISO 37001:2016 (SMAP)": "ISO 37001-2016(SMAP)",
        "CS": "CS - Corporate Secretariat",
        "MKT": "MKT - Marketing",
        "MS": "MS - Management System",
        "Internal Audit": "AUD - Internal Audit",
        "IK Proses PKS": "IK Proses PKS",
        "Estate": "Estate",
        "ISO/SMK3/ISPO": "ISO-SMK3-ISPO",
        "Storage Tank": "Storage Tank",
        "Document Control": "Document Control",
        "IK-Mutu": "IK-Mutu",
        "IK-Lingkungan": "IK-Lingkungan",
        "IK-K3": "IK-K3",
        "Refinery": "Refinery",
        "IK KCP": "IK KCP",
        "IK Refinery": "IK Refinery",
        "IK Fraksinasi": "IK Fraksinasi",
        "Halal": "Halal",
        "IK Biogas": "IK Biogas",
        "IK FOF Plant": "IK FOF Plant",
        "IK Solvent": "IK Solvent",
        "IK PELLETIZING PLANT": "IK PELLETIZING PLANT"
    }
    
    # "All" berarti tidak menggunakan filter department
    if department_filter == "All":
        department_filter = None

    # READ lama belum selalu punya metadata type_doc. Ambil kandidat lebih banyak lalu
    # singkirkan FORM di aplikasi; FORM baru aman difilter langsung lewat metadata.
    search_kwargs = {"k": 20 if document_type == "READ" else 5}
    metadata_filters = []
    if department_filter:
        db_department_name = DEPARTMENT_MAPPING.get(department_filter, department_filter)
        metadata_filters.append({"department": {"$eq": db_department_name}})
    if document_type == "FORM":
        metadata_filters.append({"type_doc": {"$eq": "FORM"}})
    if len(metadata_filters) == 1:
        search_kwargs["filter"] = metadata_filters[0]
    elif metadata_filters:
        search_kwargs["filter"] = {"$and": metadata_filters}

    retriever = vector_store.as_retriever(search_kwargs=search_kwargs)
    
    # define chat mode
    if chat_mode == "reference":
        system_prompt = (
            "Anda adalah Asisten AI MIS untuk pengguna internal perusahaan.\n"
            "Basis pengetahuan dikelola oleh tim MIS, bukan diberikan oleh pengguna yang sedang bertanya.\n"
            "Jangan pernah mengatakan 'dokumen yang Anda berikan', 'dokumen yang kamu berikan', atau kalimat sejenis.\n"
            "Dalam mode ini, Anda bertugas mencari referensi SOP/IK dan Formulir.\n"
            "Tugas Anda HANYA mencari dan menyebutkan Nama Dokumen, Departemen, dan Nomor Halaman yang terkait dengan pertanyaan pengguna.\n"
            "DILARANG KERAS menjelaskan, merangkum, atau menjabarkan isi atau langkah-langkah dari dokumen tersebut. Cukup berikan referensi lokasinya saja dalam bentuk poin-poin singkat.\n"
            "Jika informasi tidak ditemukan, katakan 'Referensi tidak ditemukan.'\n\n"
            "Konteks Dokumen:\n{context}"
        )
    else:
        system_prompt = (
            "Anda adalah Asisten AI MIS untuk pengguna internal perusahaan.\n"
            "Anda membantu menjawab pertanyaan tentang SOP/IK dan Formulir dari basis pengetahuan internal yang dikelola oleh tim MIS.\n"
            "Jawab langsung, natural, ringkas, dan profesional. Jangan membuka jawaban dengan 'berdasarkan dokumen' jika tidak diperlukan.\n"
            "Jangan pernah mengatakan 'dokumen yang Anda berikan', 'dokumen yang kamu berikan', atau memberi kesan bahwa pengguna mengunggah sumbernya.\n"
            "Gunakan hanya konteks basis pengetahuan di bawah untuk menjawab secara akurat.\n"
            "Jika informasi tidak ditemukan, katakan 'Saya belum menemukan informasi tersebut di basis pengetahuan internal.'\n"
            "Berikan jawaban utama terlebih dahulu, lalu sebutkan nama sumber, departemen, dan nomor halaman secara singkat jika tersedia.\n\n"
            "Konteks Dokumen:\n{context}"
        )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{question}"),
    ])
    
    # Retrieval dijalankan lebih dulu supaya daftar sumbernya bisa dikirim lewat header
    docs = retriever.invoke(user_query)
    if document_type == "READ":
        docs = [doc for doc in docs if doc.metadata.get("type_doc", "READ") != "FORM"][:5]

    # Construct the RAG Chain
    rag_chain = prompt | llm

    def generate():
        for chunk in rag_chain.stream({"context": format_docs(docs), "question": user_query}):
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

    response = Response(generate(), mimetype="text/plain; charset=utf-8")
    # json.dumps meng-escape non-ASCII, jadi aman dipakai sebagai nilai header
    response.headers["X-Chat-Sources"] = json.dumps(collect_sources(docs))
    return response

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3018)
