import json
from typing import Optional

from app.services.document_parser import extract_text
from app.services.summarizer import client as anthropic_client

EXTRACTION_PROMPT = """Extract program impact data from the report below into JSON with exactly this shape (use null/empty for anything not found, do not invent numbers):

{{
  "cohort_summary": {{
    "active_participants": number or null,
    "graduation_pct": number or null,
    "completion_pct": number or null,
    "status": "in_progress" or "completed" or null,
    "start_date": "YYYY-MM-DD" or null,
    "end_date": "YYYY-MM-DD" or null
  }},
  "baseline": {{
    "avg_household_size": number or null,
    "avg_pre_program_income": number or null,
    "avg_age": number or null,
    "highest_education_common": string or null,
    "employed_before_pct": number or null,
    "employed_before_type_common": string or null,
    "main_breadwinner_common": string or null
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
- cohort_summary.graduation_pct: the graduation rate percentage if explicitly stated (e.g. "89% Graduation Rate" -> 89). This is about how many participants graduated, NOT program timeline progress.
- cohort_summary.completion_pct: this means PROGRAM LIFECYCLE progress (how far through the program's timeline the cohort is), NOT graduation rate. Only set this to 100 if the report clearly describes the program as fully finished. Otherwise leave null - do not guess a lifecycle percentage that isn't explicitly stated.
- cohort_summary.status: "completed" if the report describes participants as graduated/completed the program, "in_progress" if still ongoing. Infer from context (graduation data present usually means completed).
- cohort_summary.start_date / end_date: extract from a stated program duration (e.g. "June 2024-June 2025" -> start_date "2024-06-01", end_date "2025-06-01"). Use the first day of the stated month for start, last stated month for end.
- outcomes.african_companies_pct: if the report breaks employers into more than two categories (e.g. Local/Regional/International), COMBINE Local + Regional into this single african_companies_pct value. Do not report them separately.
- outcomes.global_companies_pct: maps to "International"/"Global" company percentage from the same breakdown.
- tracks: only include if the report describes genuinely separate program tracks (e.g. different certificate programs within one cohort). A report describing a single unified program should return an empty array here - do not invent tracks.
- notable_projects: include ONLY final/bootcamp/capstone projects (name = company worked with, title = project name, body = 1-2 sentence description). Do NOT include alumni testimonials, quotes, or personal stories here - those are out of scope for this field.

- baseline fields (avg_household_size, avg_pre_program_income, avg_age, highest_education_common, employed_before_pct, employed_before_type_common, main_breadwinner_common): pull directly from any "pre-program", "baseline", or "before the programme" section (e.g. "Avg. household size: 6.5" -> avg_household_size: 6.5, "Main breadwinner (most common): Mother" -> main_breadwinner_common: "Mother"). Use USD figures for income if given, not local currency. Leave null if not stated.

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


MULTI_COHORT_EXTRACTION_PROMPT = """The document below contains M&E reporting data for MULTIPLE cohorts, one section per cohort. Extract every cohort you find into a JSON array with exactly this shape:

[
  {{
    "cohort_name": string,
    "active_participants": number or null,
    "graduation_pct": number or null,
    "completion_pct": number or null,
    "status": "in_progress" or "completed" or null,
    "employment_rate": number or null,
    "avg_income_growth_multiplier": number or null,
    "post_avg_monthly_income": number or null,
    "african_companies_pct": number or null,
    "global_companies_pct": number or null,
    "avg_household_size": number or null,
    "avg_pre_program_income": number or null,
    "avg_age": number or null,
    "highest_education_common": string or null,
    "employed_before_pct": number or null,
    "employed_before_type_common": string or null,
    "main_breadwinner_common": string or null
  }}
]

Field notes:
- cohort_name: normalize to the form "Cohort N" (e.g. a column or section labeled "C1" or "Cohort 1" both become "Cohort 1"). This is used to match against existing records, so be consistent.
- active_participants: use the graduate/completed count if given (e.g. "No. graduates" or "Talents Graduated"), not the total intake, unless no graduate count is given.
- graduation_pct: the graduation rate percentage.
- completion_pct: only set to 100 if the cohort is explicitly described as finished/completed. Leave null otherwise - do not guess.
- status: "completed" if graduation/employment data exists for this cohort, "in_progress" if the cohort has no endline data yet (e.g. graduates/employment fields are blank or marked not available).
- employment_rate: percentage employed at endline.
- avg_income_growth_multiplier: the income increase factor (e.g. "19.4x" -> 19.4).
- post_avg_monthly_income: average individual income post-program, in USD if given.
- african_companies_pct: if the document splits company location into Local + Regional + International (or similar), COMBINE Local + Regional into this one value. If it already gives a single "African companies" or "Local+Regional" figure, use that directly.
- global_companies_pct: maps to "International" percentage.
- If a cohort's section has no data at all for a field (still in progress, not yet available), use null - do not invent a number.

- avg_household_size, avg_pre_program_income, avg_age, highest_education_common, employed_before_pct, employed_before_type_common, main_breadwinner_common: same as other fields, pull from that cohort's baseline/pre-program section specifically, not a combined/cumulative row. Leave null if not stated for that cohort.

Return ONLY the JSON array, no other text, no markdown fences.

DOCUMENT TEXT:
{text}
"""


def extract_multi_cohort_data(filename: str, file_bytes: bytes) -> Optional[list]:
    """
    Same best-effort extraction approach as extract_report_data, but for a
    single document covering multiple cohorts at once (e.g. a consolidated
    M&E reporting workbook). Returns a list of per-cohort dicts, or None on
    failure.
    """
    try:
        raw_text = extract_text(filename, file_bytes)
    except Exception:
        return None

    prompt = MULTI_COHORT_EXTRACTION_PROMPT.format(text=raw_text[:30000])

    try:
        response = anthropic_client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        raw_output = response.content[0].text.strip()
        if raw_output.startswith("```"):
            raw_output = raw_output.strip("`").lstrip("json").strip()
        result = json.loads(raw_output)
        return result if isinstance(result, list) else None
    except Exception:
        return None
