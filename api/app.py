import os
from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
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

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    google_api_key=api_key,
    output_dimensionality=768,
)

# 2. Vector Store Connection
connection_string = os.getenv("DATABASE_URL")
if not connection_string:
    raise ValueError("DATABASE_URL is missing!")

vector_store = PGVector(
    embeddings=embeddings,
    collection_name="sop_ik_documents",
    connection=connection_string,
    use_jsonb=True,
)

# 3. LLM and prompt setup
llm = ChatGoogleGenerativeAI(model='gemini-3.1-flash-lite', google_api_key=api_key, temperature=0.2)

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
    data = request.get_json() or {}
    user_query = data.get("query")
    department_filter = data.get("department")  # Optional metadata filter

    if not user_query:
        return jsonify({"error": "Query is required"}), 400

    # Build search parameters with optional metadata filtering, fetch the top 3 most relevant text chunks
    search_kwargs = {"k": 3}
    if department_filter:
        search_kwargs["filter"] = {"department": department_filter}

    retriever = vector_store.as_retriever(search_kwargs=search_kwargs)

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