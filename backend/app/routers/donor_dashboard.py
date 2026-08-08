from typing import List
from fastapi import APIRouter, Depends
from app.core.deps import get_current_user
from app.db.supabase_client import supabase
from app.models.cohort_schemas import CohortOut

router = APIRouter(prefix="/donor/dashboard", tags=["donor-dashboard"])


@router.get("/cohorts", response_model=List[CohortOut])
async def get_cohorts(user: dict = Depends(get_current_user)):
    result = supabase.table("cohorts").select("*").order("created_at").execute()
    return result.data


@router.get("/summary")
async def get_summary(user: dict = Depends(get_current_user)):
    result = supabase.table("landing_stats").select("*").limit(1).execute()
    if not result.data:
        return {}
    return result.data[0]


@router.get("/insights")
async def get_insights(user: dict = Depends(get_current_user)):
    result = supabase.table("dashboard_insights").select("title, body").order("generated_at").execute()
    return result.data


@router.get("/baseline")
async def get_baseline(user: dict = Depends(get_current_user)):
    result = supabase.table("participants").select("*").execute()
    rows = result.data

    if not rows:
        return {
            "avg_household_size": 0,
            "avg_pre_program_income": 0,
            "main_breadwinner_breakdown": {},
            "avg_age": 0,
            "highest_education_common": "",
            "employed_before_pct": 0,
            "employed_before_type_common": "",
        }

    household_sizes = [r["household_size"] for r in rows if r.get("household_size") is not None]
    incomes = [r["pre_program_income"] for r in rows if r.get("pre_program_income") is not None]
    ages = [r["age"] for r in rows if r.get("age") is not None]

    breadwinner_counts: dict = {}
    for r in rows:
        b = r.get("main_breadwinner")
        if b:
            breadwinner_counts[b] = breadwinner_counts.get(b, 0) + 1
    total_breadwinner = sum(breadwinner_counts.values()) or 1
    breadwinner_breakdown = {
        k: round((v / total_breadwinner) * 100) for k, v in breadwinner_counts.items()
    }

    education_counts: dict = {}
    for r in rows:
        e = r.get("highest_education")
        if e:
            education_counts[e] = education_counts.get(e, 0) + 1
    most_common_education = max(education_counts, key=education_counts.get) if education_counts else ""

    employed_before_count = sum(1 for r in rows if r.get("employed_before") is True)
    employed_before_pct = round((employed_before_count / len(rows)) * 100) if rows else 0

    job_type_counts: dict = {}
    for r in rows:
        if r.get("employed_before") and r.get("employed_before_type"):
            t = r["employed_before_type"]
            job_type_counts[t] = job_type_counts.get(t, 0) + 1
    most_common_job_type = max(job_type_counts, key=job_type_counts.get) if job_type_counts else ""

    return {
        "avg_household_size": round(sum(household_sizes) / len(household_sizes), 1) if household_sizes else 0,
        "avg_pre_program_income": round(sum(incomes) / len(incomes), 1) if incomes else 0,
        "main_breadwinner_breakdown": breadwinner_breakdown,
        "avg_age": round(sum(ages) / len(ages), 1) if ages else 0,
        "highest_education_common": most_common_education,
        "employed_before_pct": employed_before_pct,
        "employed_before_type_common": most_common_job_type,
    }


@router.get("/origins")
async def get_origins(user: dict = Depends(get_current_user)):
    participants_result = supabase.table("participants").select("district, country").execute()
    rows = participants_result.data

    coords_result = supabase.table("district_coordinates").select("*").execute()
    coords_by_district = {c["district"]: c for c in coords_result.data}

    district_counts: dict = {}
    country_counts: dict = {}

    for r in rows:
        country = r.get("country") or "Uganda"
        district = r.get("district")

        if country == "Uganda" and district:
            district_counts[district] = district_counts.get(district, 0) + 1
        elif country != "Uganda":
            country_counts[country] = country_counts.get(country, 0) + 1

    uganda_districts = [
        {
            "district": d,
            "participant_count": count,
            "latitude": coords_by_district.get(d, {}).get("latitude"),
            "longitude": coords_by_district.get(d, {}).get("longitude"),
        }
        for d, count in district_counts.items()
    ]

    international = [
        {"country": c, "participant_count": count} for c, count in country_counts.items()
    ]

    return {"uganda_districts": uganda_districts, "international": international}
