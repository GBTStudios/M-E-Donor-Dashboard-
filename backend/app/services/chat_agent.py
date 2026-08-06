from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.prebuilt import create_react_agent

from app.core.config import settings
from app.services.knowledge_retrieval import search_knowledge_base

SYSTEM_PROMPT = """You are a helpful assistant for Groundbreaker Impact, an NGO.
Answer questions using the search_knowledge_base tool when the question might be
answered by published organizational documents (reports, data, program information).
For general questions unrelated to Groundbreaker's specific programs or data, answer
directly without searching. Do not cite sources or mention "documents" explicitly -
just answer naturally. If the knowledge base search returns nothing relevant, say
you don't have specific information on that topic rather than making something up."""


@tool
def knowledge_base_search(query: str) -> str:
    """Search Groundbreaker's published knowledge base for information relevant to the query."""
    chunks = search_knowledge_base(query)
    if not chunks:
        return "No relevant information found in the knowledge base."
    return "\n\n".join(chunks)


_agent = None


def _get_agent():
    global _agent
    if _agent is None:
        model = ChatAnthropic(
            model="claude-haiku-4-5-20251001",
            api_key=settings.anthropic_api_key,
        )
        _agent = create_react_agent(model, tools=[knowledge_base_search], prompt=SYSTEM_PROMPT)
    return _agent


def run_chat_agent(conversation_history: list[dict], new_message: str) -> str:
    agent = _get_agent()

    messages = []
    for msg in conversation_history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(AIMessage(content=msg["content"]))
    messages.append(HumanMessage(content=new_message))

    result = agent.invoke({"messages": messages})
    final_message = result["messages"][-1]
    return final_message.content
