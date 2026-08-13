import json
from typing import Optional

from app.services.document_parser import extract_text
from app.services.summarizer import client as anthropic_client

EXTRACTION_PROMPT = """Extract program impact data from the report below into JSON with exactly this shape (use null/empty for anything not found, do not invent numbers):

{{
  "cohort_summary": {{
    "active_participants": number or null
  }},
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
  }},
  "notable_projects": [
    {{"name": string, "title": string, "body": string}}
  ]
}}

Field notes:
- cohort_summary.active_participants: the total number of participants/talents in this cohort (e.g. "15 Talents Graduated" -> 15). If graduated and enrolled counts differ, use the graduated/completed count.
- outcomes.african_companies_pct: if the report breaks employers into more than two categories (e.g. Local/Regional/International), COMBINE Local + Regional into this single african_companies_pct value. Do not report them separately.
- outcomes.global_companies_pct: maps to "International"/"Global" company percentage from the same breakdown.
- tracks: only include if the report describes genuinely separate program tracks (e.g. different certificate programs within one cohort). A report describing a single unified program should return an empty array here - do not invent tracks.
- notable_projects: include ONLY final/bootcamp/capstone projects (name = company worked with, title = project name, body = 1-2 sentence description). Do NOT include alumni testimonials, quotes, or personal stories here - those are out of scope for this field.

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

    prompt = EXTRACTION_PROMPT.format(text=raw_text[:20000])

    try:
        response = anthropic_client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=3072,
            messages=[{"role": "user", "content": prompt}],
        )
        raw_output = response.content[0].text.strip()
        if raw_output.startswith("```"):
            raw_output = raw_output.strip("`").lstrip("json").strip()
        return json.loads(raw_output)
    except Exception:
        return None
