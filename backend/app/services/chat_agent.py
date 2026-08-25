from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage

from app.core.config import settings
from app.services.knowledge_retrieval import search_knowledge_base

SYSTEM_PROMPT_TEMPLATE = """You are a helpful assistant for Groundbreaker Talents, an NGO
running youth employment and training programs. (Note: "Groundbreaker Impact" is
the name of this donor dashboard/data platform - it is NOT the organization itself.
Always refer to the organization as "Groundbreaker Talents" when answering questions
or suggesting someone contact the organization directly - never say "Groundbreaker
Impact" as if it were the org.)

Answer questions using the search_knowledge_base tool when the question might be
answered by published organizational documents (reports, data, program information).
For general questions unrelated to Groundbreaker Talents' specific programs or data,
answer directly without searching. Do not cite sources or mention "documents"
explicitly - just answer naturally. If the knowledge base search returns nothing
relevant, say you don't have specific information on that topic and suggest
contacting Groundbreaker Talents directly, rather than making something up.

Respond in this language: {language}"""


@tool
def knowledge_base_search(query: str) -> str:
    """Search Groundbreaker's published knowledge base for information relevant to the query."""
    chunks = search_knowledge_base(query)
    if not chunks:
        return "No relevant information found in the knowledge base."
    return "\n\n".join(chunks)


_agents_by_language: dict = {}


def _get_agent(language: str):
    if language not in _agents_by_language:
        from langchain_anthropic import ChatAnthropic
        from langgraph.prebuilt import create_react_agent

        model = ChatAnthropic(
            model="claude-haiku-4-5-20251001",
            api_key=settings.anthropic_api_key,
        )
        prompt = SYSTEM_PROMPT_TEMPLATE.format(language=language)
        _agents_by_language[language] = create_react_agent(model, tools=[knowledge_base_search], prompt=prompt)
    return _agents_by_language[language]


def run_chat_agent(conversation_history: list[dict], new_message: str, language: str = "en") -> str:
    agent = _get_agent(language)

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
