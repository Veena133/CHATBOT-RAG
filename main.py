import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from retrieval import load_faq_data, create_faiss_vector_store, get_relevant_docs
from llm import get_llm_response

app = FastAPI()
# to run the backend
# uvicorn main:app --reload
# to run the frontend
# npm start
# Add CORS middleware here!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = "data/faq_data.csv"

try:
    texts, metadatas = load_faq_data(DATA_PATH)
    vector_store = create_faiss_vector_store(texts, metadatas)
except Exception as e:
    print(f"Error loading FAQ data or creating vector store: {e}")
    texts, metadatas, vector_store = [], [], None

class QueryRequest(BaseModel):
    question: str

@app.post("/ask")
async def ask_question(request: QueryRequest):
    if not vector_store:
        return {"answer": "Knowledge base not loaded. Please contact admin."}
    relevant_docs = get_relevant_docs(request.question, vector_store)
    context = "\n".join([doc.page_content for doc in relevant_docs])
    answer = get_llm_response(request.question, context)
    return {"answer": answer}
