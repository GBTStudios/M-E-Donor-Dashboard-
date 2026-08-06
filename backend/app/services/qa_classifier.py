import json
import re

from langchain_anthropic import ChatAnthropic
from app.core.config import settings

CLASSIFY_PROMPT = """Classify this Q&A exchange from a donor chatbot.

Question: {question}
Response: {response}

Determine the status:
- "declined": the response says it doesn't have the information / can't answer
- "flagged": the question or response touches a sensitive topic (finances/budget, legal matters, personal/PII data, HR/personnel issues, anything that shouldn't be answered by an AI without human review)
- "answered": a normal, appropriate answer was given, nothing sensitive

Respond with ONLY valid JSON, no other text, no markdown formatting, no code fences:
{{"status": "answered" | "declined" | "flagged", "reason": "brief reason if declined or flagged, else null"}}
"""

_model = None


def _get_model():
    global _model
    if _model is None:
        _model = ChatAnthropic(model="claude-haiku-4-5-20251001", api_key=settings.anthropic_api_key)
    return _model


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def classify_qa_exchange(question: str, response: str) -> dict:
    model = _get_model()
    prompt = CLASSIFY_PROMPT.format(question=question, response=response)

    result = model.invoke(prompt)
    text = _strip_code_fences(result.content)

    try:
        parsed = json.loads(text)
        return {
            "status": parsed.get("status", "answered"),
            "reason": parsed.get("reason"),
        }
    except (json.JSONDecodeError, AttributeError):
        return {"status": "answered", "reason": None}
