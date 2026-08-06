import json
import re

from langchain_anthropic import ChatAnthropic
from app.core.config import settings
from app.db.supabase_client import supabase

INSIGHT_PROMPT = """Given these organizational impact statistics, generate 2 short strategic insight blurbs for a donor-facing dashboard. Each should have a short title (a few words) and a 1-2 sentence body highlighting a genuinely notable observation from the numbers below. Be factual - only reference numbers actually given, never invent figures.

Stats:
{stats}

Respond with ONLY valid JSON, no markdown formatting, no code fences:
[{{"title": "...", "body": "..."}}, {{"title": "...", "body": "..."}}]
"""

_model = None


def _get_model():
    global _model
    if _model is None:
        _model = ChatAnthropic(model="claude-haiku-4-5-20251001", api_key=settings.anthropic_api_key)
    return _model


def regenerate_insights():
    stats_result = supabase.table("landing_stats").select("*").limit(1).execute()
    if not stats_result.data:
        return

    stats = stats_result.data[0]
    model = _get_model()
    prompt = INSIGHT_PROMPT.format(stats=json.dumps(stats, default=str))

    result = model.invoke(prompt)
    text = result.content.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    try:
        insights = json.loads(text)
    except json.JSONDecodeError:
        return

    supabase.table("dashboard_insights").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

    for insight in insights:
        supabase.table("dashboard_insights").insert({
            "title": insight["title"],
            "body": insight["body"],
        }).execute()
