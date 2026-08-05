from anthropic import Anthropic
from app.core.config import settings

client = Anthropic(api_key=settings.anthropic_api_key)

SUMMARY_PROMPT = """You are helping an NGO turn a raw document into a structured executive summary for internal knowledge base use.

Given the raw extracted text below, produce a summary formatted as clean, well-structured Markdown. Follow these formatting rules exactly:

- Use `##` for main section headers (e.g. "## Executive Summary", "## Key Findings", "## Recommendations"). Use `###` for subsections if a section needs to be broken down further.
- Bold every key figure or statistic using **...** — percentages, rates, monetary amounts, counts, dates tied to results. Numbers should visually stand out, not be buried inside a sentence.
- Use bullet points (`-`) or numbered lists (`1.`, `2.`) for findings, recommendations, or any enumerated items. Do not write these as a single paragraph.
- Keep the overall structure consistent across documents: start with a short "## Executive Summary" (1-2 sentences), followed by "## Key Findings" as a list, followed by "## Recommendations" as a list. Add additional sections only if the document clearly contains distinct content that doesn't fit those three (e.g. "## Methodology" or "## Limitations") — don't force sections that don't apply.
- Keep it concise and factual. Do not invent numbers or findings that aren't in the source text. If the document doesn't contain clear findings or recommendations, say so plainly in that section rather than fabricating content.

Output only the Markdown summary itself — no preamble like "Here is the summary," no closing remarks, no code fences around it.

Raw document text:
---
{raw_text}
---
"""


def summarize_document(raw_text: str) -> str:
    truncated = raw_text[:15000]  # keep prompt size reasonable; long docs get truncated for now

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1000,
        messages=[
            {"role": "user", "content": SUMMARY_PROMPT.format(raw_text=truncated)}
        ],
    )
    return response.content[0].text