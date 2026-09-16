import os
from flask import Flask, request, Response, jsonify
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_postgres.vectorstores import PGVector
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

load_dotenv()
app = Flask(__name__)

# 1. Initialize Models and Database Connection
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.2)

vector_store = PGVector(
    embeddings=embeddings,
    collection_name="legacy_documents",
    connection=os.getenv("DATABASE_URL"),
)

# Convert the vector store into a retriever that fetches the top 3 results
retriever = vector_store.as_retriever(search_kwargs={"k": 3})

# 2. Define the System Prompt Template
system_prompt = (
    "You are an assistant for question-answering tasks. "
    "Use the following retrieved context to answer the question. "
    "If you don't know the answer, say that you don't know.\n\n"
    "Context: {context}"
)
prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{question}"),
])

# 3. Create the RAG Chain using LCEL (LangChain Expression Language)
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
)

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_query = data.get("query")
    
    if not user_query:
        return jsonify({"error": "Query is required"}), 400

    # Execute the chain and stream the response chunk-by-chunk
    def generate():
        for chunk in rag_chain.stream(user_query):
            yield chunk.content
            
    return Response(generate(), mimetype="text/plain")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)