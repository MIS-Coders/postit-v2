import os
from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_voyageai import VoyageAIEmbeddings
from langchain_postgres.vectorstores import PGVector
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

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

# 3. LLM and prompt setup
llm = ChatGoogleGenerativeAI(model='gemini-3.1-flash-lite', google_api_key=api_key, temperature=0.2)

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
    auth_header = request.headers.get("Authorization")
    super_secret = os.getenv("APP_SECRET_TOKEN")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Invalid or missing authorization header"}), 401

    if auth_header != f"Bearer {super_secret}":
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    user_query = data.get("query")
    department_filter = data.get("department")  # Optional metadata filter
    
    chat_mode = data.get("mode", "explain")
    
    if not user_query:
        return jsonify({"error": "Query is required"}), 400
    
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