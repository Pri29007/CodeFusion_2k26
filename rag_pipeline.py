"""
RAG pipeline for scheme knowledge.

IMPORTANT DESIGN CHOICE: the vector store is seeded from ONLY the 3 JSON files in
/schemes. This is what keeps the "eligibility matching" step honest — the retriever
physically cannot return a scheme that isn't PM-KISAN, PMAY, or Ayushman Bharat,
because nothing else was ever embedded. This is a stronger guarantee than a prompt
instruction alone.
"""
import json
import glob
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from supabase import create_client

from config import SUPABASE_DB_URL, VECTOR_COLLECTION_NAME

# Open-source embedding model — no API key needed, good multilingual support
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"


def load_scheme_documents(schemes_dir: str = "schemes") -> list[Document]:
    """Turn each scheme JSON into one or more LangChain Documents for embedding."""
    documents = []
    for filepath in glob.glob(f"{schemes_dir}/*.json"):
        with open(filepath, "r") as f:
            scheme = json.load(f)

        # One document per scheme, with criteria flattened into readable text.
        # Keeping it as one chunk per scheme (not split further) because eligibility
        # criteria need to be read together, not in fragments.
        text = (
            f"Scheme: {scheme['name']}\n"
            f"Category: {scheme['category']}\n"
            f"Summary: {scheme['summary']}\n"
            f"Eligibility Criteria:\n- " + "\n- ".join(scheme["eligibility_criteria"]) + "\n"
            f"Required Documents: {', '.join(scheme['required_documents'])}\n"
            f"Benefit: {scheme['benefit_amount']}"
        )

        documents.append(
            Document(
                page_content=text,
                metadata={
                    "scheme_id": scheme["scheme_id"],
                    "scheme_name": scheme["name"],
                },
            )
        )
    return documents


def build_vector_store():
    """Embed and upsert the 3 scheme documents into Supabase pgvector. Run once at setup."""
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    supabase_client = create_client(SUPABASE_DB_URL, "")  # use service key in practice

    docs = load_scheme_documents()
    vector_store = SupabaseVectorStore.from_documents(
        docs,
        embeddings,
        client=supabase_client,
        table_name=VECTOR_COLLECTION_NAME,
        query_name=f"match_{VECTOR_COLLECTION_NAME}",
    )
    print(f"Indexed {len(docs)} scheme documents into pgvector.")
    return vector_store


def get_retriever(k: int = 3):
    """
    Retriever used at query time. k=3 because we only ever have 3 schemes total —
    this effectively always returns all schemes ranked by relevance to the citizen's
    profile, letting the LLM reason over full context rather than a narrow slice.
    """
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    supabase_client = create_client(SUPABASE_DB_URL, "")
    vector_store = SupabaseVectorStore(
        client=supabase_client,
        embedding=embeddings,
        table_name=VECTOR_COLLECTION_NAME,
        query_name=f"match_{VECTOR_COLLECTION_NAME}",
    )
    return vector_store.as_retriever(search_kwargs={"k": k})


if __name__ == "__main__":
    build_vector_store()