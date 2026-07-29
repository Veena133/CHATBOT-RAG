import pandas as pd
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import CharacterTextSplitter
from langchain.docstore.document import Document

def load_faq_data(csv_path):
    df = pd.read_csv(csv_path)
    print("Columns in CSV:", df.columns)  # Debug: shows the exact column names
    # Strip spaces from column names just in case
    df.columns = df.columns.str.strip()
    if 'Answer/Info' not in df.columns:
        raise KeyError("Column 'Answer/Info' not found in CSV. Available columns: " + ", ".join(df.columns))
    texts = df['Answer/Info'].tolist()
    metadatas = df.to_dict(orient='records')
    return texts, metadatas

def create_faiss_vector_store(texts, metadatas):
    splitter = CharacterTextSplitter(chunk_size=300, chunk_overlap=20)
    docs = []
    for text, meta in zip(texts, metadatas):
        splits = splitter.split_text(text)
        for chunk in splits:
            docs.append(Document(page_content=chunk, metadata=meta))
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vector_store = FAISS.from_documents(docs, embeddings)
    return vector_store

def get_relevant_docs(query, vector_store, k=3):
    return vector_store.similarity_search(query, k=k)
