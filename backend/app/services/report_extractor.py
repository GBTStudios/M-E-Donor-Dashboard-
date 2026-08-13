import json
from typing import Optional

from app.services.document_parser import extract_text
from app.services.summarizer import client as anthropic_client

EXTRACTION_PROMPT = """Extract program impact data from the report below into JSON with exactly this shape (use null for anything not found, do not invent numbers):

{{
  "outcomes": {{
    "employment_rate": number or null,
    "avg_income_growth_multiplier": number or null,
    "post_avg_monthly_income": number or null,
    "african_companies_pct": number or null,
    "global_companies_pct": number or null
  }},
  "tracks": [
    {{"name": string, "participant_count": number or null, "completion_pct": number or null, "status": "in_progress" or "completed"}}
  ],
  "narrative": {{
    "title": string or null,
    "body": string or null
  }}
}}

Return ONLY the JSON object, no other text, no markdown fences.

REPORT TEXT:
{text}
"""


def extract_report_data(filename: str, file_bytes: bytes) -> Optional[dict]:
    """
    Best-effort structured extraction from an uploaded report file.
    AI inference, not exact extraction - same accuracy caveat as the
    PDF participant import. Returns None on any failure so the caller
    can mark extraction as failed without crashing the upload flow.
    """
    try:
        raw_text = extract_text(filename, file_bytes)
    except Exception:
        return None

    prompt = EXTRACTION_PROMPT.format(text=raw_text[:15000])

    try:
        response = anthropic_client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        raw_output = response.content[0].text.strip()
        if raw_output.startswith("```"):
            raw_output = raw_output.strip("`").lstrip("json").strip()
        return json.loads(raw_output)
    except Exception:
        return None
