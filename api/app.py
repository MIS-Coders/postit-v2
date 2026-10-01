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
# Test Endpoint
# ============================================================
# @app.route("/api/debug-retrieval", methods=["POST"])
# def debug_retrieval():
#     try:
#         data = request.get_json() or {}

#         user_query = data.get("query")
#         department_filter = data.get("department")

#         if not user_query:
#             return jsonify({"error": "Query is required"}), 400

#         if department_filter == "All":
#             department_filter = None

#         print()
#         print("=" * 60, flush=True)
#         print("DEBUG RETRIEVAL", flush=True)
#         print("=" * 60, flush=True)
#         print("Query      :", user_query, flush=True)
#         print("Department :", department_filter, flush=True)

#         docs = vector_store.similarity_search(
#             user_query,
#             k=3,
#             filter=(
#                 {"department": department_filter}
#                 if department_filter
#                 else None
#             ),
#         )

#         print("Documents  :", len(docs), flush=True)
#         print("-" * 60, flush=True)

#         results = []

#         for i, doc in enumerate(docs, start=1):
#             print(f"--- DOCUMENT {i} ---", flush=True)
#             print("Source    :", doc.metadata.get("source"), flush=True)
#             print("Department:", doc.metadata.get("department"), flush=True)
#             print("Pages     :", doc.metadata.get("pages"), flush=True)
#             print("Chunk     :", doc.metadata.get("chunk"), flush=True)
#             print("Content   :", doc.page_content[:500], flush=True)

#             results.append({
#                 "source": doc.metadata.get("source"),
#                 "department": doc.metadata.get("department"),
#                 "pages": doc.metadata.get("pages"),
#                 "chunk": doc.metadata.get("chunk"),
#                 "content": doc.page_content,
#             })

#         print("=" * 60, flush=True)

#         return jsonify({
#             "query": user_query,
#             "department": department_filter,
#             "documents_found": len(docs),
#             "results": results,
#         })

#     except Exception as e:
#         import traceback

#         print()
#         print("=" * 60, flush=True)
#         print("DEBUG RETRIEVAL ERROR", flush=True)
#         print("=" * 60, flush=True)
#         traceback.print_exc()
#         print("=" * 60, flush=True)

#         return jsonify({
#             "error": str(e),
#             "type": type(e).__name__,
#         }), 500

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

    if not user_query:
        return jsonify({"error": "Query is required"}), 400
    
    # "All" berarti tidak menggunakan filter department
    if department_filter == "All":
        department_filter = None

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