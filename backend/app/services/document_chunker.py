from app.services.embeddings import generate_embedding
from app.db.supabase_client import supabase

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def chunk_text(text: str) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunks.append(text[start:end])
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return [c.strip() for c in chunks if c.strip()]


def embed_and_store_document(document_id: str, content: str):
    supabase.table("document_chunks").delete().eq("document_id", document_id).execute()

    chunks = chunk_text(content)
    rows = []
    for chunk in chunks:
        embedding = generate_embedding(chunk)
        rows.append({
            "document_id": document_id,
            "chunk_text": chunk,
            "embedding": embedding,
        })

    if rows:
        supabase.table("document_chunks").insert(rows).execute()

    return len(rows)
