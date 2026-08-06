from app.services.embeddings import generate_embedding
from app.db.supabase_client import supabase


def _format_embedding_for_pg(embedding: list[float]) -> str:
    return "[" + ",".join(str(x) for x in embedding) + "]"


def search_knowledge_base(query: str, top_k: int = 5) -> list[str]:
    query_embedding = generate_embedding(query)
    formatted = _format_embedding_for_pg(query_embedding)

    result = supabase.rpc(
        "match_document_chunks",
        {"query_embedding": formatted, "match_count": top_k},
    ).execute()

    return [row["chunk_text"] for row in result.data]
