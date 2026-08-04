from openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.openai_api_key)

SUMMARY_PROMPT = """You are helping an NGO turn a raw document into a structured executive summary for internal knowledge base use.

Given the raw extracted text below, produce a summary in exactly this format:

[TITLE IN CAPS] - EXECUTIVE SUMMARY

[1-2 sentence overview of what this document covers]

Key Findings:
1. [finding]
2. [finding]
3. [finding]

Recommendations:
- [recommendation]
- [recommendation]

Keep it concise and factual. Do not invent numbers or findings that aren't in the source text. If the document doesn't contain clear findings or recommendations, say so plainly rather than making something up.

Raw document text:
---
{raw_text}
---
"""


def summarize_document(raw_text: str) -> str:
    truncated = raw_text[:15000]  # keep prompt size reasonable; long docs get truncated for now

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": SUMMARY_PROMPT.format(raw_text=truncated)}
        ],
        temperature=0.3,
    )
    return response.choices[0].message.content