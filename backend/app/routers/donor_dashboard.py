from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.deps import get_current_user
from app.db.supabase_client import supabase
from app.models.cohort_schemas import CohortOut, CohortDetailOut
from app.models.report_schemas import ReportListItem, ReportDetail
from app.models.track_schemas import TrackOut
from app.models.outcome_schemas import CohortOutcomesOut
from app.services.geocoding import geocode_district

router = APIRouter(prefix="/donor/dashboard", tags=["donor-dashboard"])


def _graduation_pct_map() -> dict:
    participants_result = supabase.table("participants").select("cohort_id, graduation_status").execute()
    participants = participants_result.data

    total_counts: dict = {}
    grad_counts: dict = {}
    for p in participants:
        cid = p.get("cohort_id")
        if not cid:
            continue
        total_counts[cid] = total_counts.get(cid, 0) + 1
        if p.get("graduation_status") == "graduated":
            grad_counts[cid] = grad_counts.get(cid, 0) + 1

    return {
        cid: round((grad_counts.get(cid, 0) / total) * 100, 1)
        for cid, total in total_counts.items()
    }


def _employment_rate_map() -> dict:
    result = supabase.table("cohort_outcomes").select("cohort_id, employment_rate").execute()
    return {r["cohort_id"]: r["employment_rate"] for r in result.data if r.get("employment_rate") is not None}


def _compute_baseline(rows: list) -> dict:
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


@router.get("/cohorts", response_model=List[CohortOut])
async def get_cohorts(user: dict = Depends(get_current_user)):
    cohorts_result = supabase.table("cohorts").select("*").order("created_at").execute()
    cohorts = cohorts_result.data
    grad_map = _graduation_pct_map()
    emp_map = _employment_rate_map()

    return [
        {**c, "graduation_pct": grad_map.get(c["id"], 0), "employment_rate": emp_map.get(c["id"])}
        for c in cohorts
    ]


@router.get("/cohorts/{cohort_id}", response_model=CohortDetailOut)
async def get_cohort_detail(cohort_id: str, user: dict = Depends(get_current_user)):
    result = supabase.table("cohorts").select("*").eq("id", cohort_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cohort not found.")

    cohort = result.data[0]
    grad_map = _graduation_pct_map()

    outcomes_result = supabase.table("cohort_outcomes").select("*").eq("cohort_id", cohort_id).execute()
    outcomes = outcomes_result.data[0] if outcomes_result.data else {}

    return {
        **cohort,
        "graduation_pct": grad_map.get(cohort_id, 0),
        "employment_rate": outcomes.get("employment_rate"),
        "avg_income_growth_multiplier": outcomes.get("avg_income_growth_multiplier"),
    }


@router.get("/cohorts/{cohort_id}/tracks", response_model=List[TrackOut])
async def get_cohort_tracks(cohort_id: str, user: dict = Depends(get_current_user)):
    cohort_check = supabase.table("cohorts").select("id").eq("id", cohort_id).execute()
    if not cohort_check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cohort not found.")

    result = supabase.table("cohort_tracks").select("*").eq("cohort_id", cohort_id).order("created_at").execute()
    return result.data


@router.get("/cohorts/{cohort_id}/baseline")
async def get_cohort_baseline(cohort_id: str, user: dict = Depends(get_current_user)):
    cohort_check = supabase.table("cohorts").select("id").eq("id", cohort_id).execute()
    if not cohort_check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cohort not found.")

    result = supabase.table("participants").select("*").eq("cohort_id", cohort_id).execute()
    return _compute_baseline(result.data)


@router.get("/cohorts/{cohort_id}/outcomes", response_model=CohortOutcomesOut)
async def get_cohort_outcomes(cohort_id: str, user: dict = Depends(get_current_user)):
    cohort_check = supabase.table("cohorts").select("id").eq("id", cohort_id).execute()
    if not cohort_check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cohort not found.")

    result = supabase.table("cohort_outcomes").select("*").eq("cohort_id", cohort_id).execute()
    outcomes = result.data[0] if result.data else {}

    projects_result = supabase.table("stories").select("id").eq("cohort_id", cohort_id).execute()
    notable_count = len(projects_result.data)

    return {
        "employment_rate": outcomes.get("employment_rate"),
        "avg_income_growth_multiplier": outcomes.get("avg_income_growth_multiplier"),
        "post_avg_monthly_income": outcomes.get("post_avg_monthly_income"),
        "african_companies_pct": outcomes.get("african_companies_pct"),
        "global_companies_pct": outcomes.get("global_companies_pct"),
        "notable_projects_count": notable_count,
    }


@router.get("/cohorts/{cohort_id}/projects")
async def get_cohort_projects(cohort_id: str, user: dict = Depends(get_current_user)):
    cohort_check = supabase.table("cohorts").select("id").eq("id", cohort_id).execute()
    if not cohort_check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cohort not found.")

    result = (
        supabase.table("stories")
        .select("*")
        .eq("cohort_id", cohort_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/cohorts/{cohort_id}/narrative")
async def get_cohort_narrative(cohort_id: str, user: dict = Depends(get_current_user)):
    cohort_check = supabase.table("cohorts").select("id").eq("id", cohort_id).execute()
    if not cohort_check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cohort not found.")

    result = (
        supabase.table("dashboard_insights")
        .select("id, title, body, generated_at")
        .eq("cohort_id", cohort_id)
        .order("generated_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/cohorts/{cohort_id}/report", response_model=ReportDetail)
async def get_cohort_report(cohort_id: str, user: dict = Depends(get_current_user)):
    result = (
        supabase.table("reports")
        .select("*")
        .eq("cohort_id", cohort_id)
        .order("report_date", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No report found for this cohort.")
    return result.data[0]


@router.get("/reports", response_model=List[ReportListItem])
async def get_reports(
    user: dict = Depends(get_current_user),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
):
    query = supabase.table("reports").select(
        "id, title, cohort_id, report_date, file_type, file_size, created_at"
    ).order("report_date", desc=True)

    if start_date:
        query = query.gte("report_date", start_date.isoformat())
    if end_date:
        query = query.lte("report_date", end_date.isoformat())

    result = query.execute()
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
    return _compute_baseline(result.data)


@router.get("/origins")
async def get_origins(user: dict = Depends(get_current_user)):
    participants_result = supabase.table("participants").select("district, country").execute()
    rows = participants_result.data

    coords_result = supabase.table("district_coordinates").select("*").execute()
    coords_by_district = {c["district"]: c for c in coords_result.data}

    country_coords_result = supabase.table("country_coordinates").select("*").execute()
    coords_by_country = {c["country"]: c for c in country_coords_result.data}

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

    # Auto-geocode any international country we haven't seen before, same
    # pattern as district auto-geocoding on participant import.
    for country in country_counts:
        if country not in coords_by_country:
            coords = geocode_district(country, country="")
            if coords:
                lat, lon = coords
                supabase.table("country_coordinates").insert({
                    "country": country, "latitude": lat, "longitude": lon,
                }).execute()
                coords_by_country[country] = {"latitude": lat, "longitude": lon}

    international = [
        {
            "country": c,
            "participant_count": count,
            "latitude": coords_by_country.get(c, {}).get("latitude"),
            "longitude": coords_by_country.get(c, {}).get("longitude"),
        }
        for c, count in country_counts.items()
    ]

    return {"uganda_districts": uganda_districts, "international": international}