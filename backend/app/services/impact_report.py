import io
import tempfile

from fpdf import FPDF

from app.db.supabase_client import supabase
from app.services.chart_generator import generate_cohort_completion_chart


def generate_impact_summary_pdf() -> bytes:
    stats_result = supabase.table("landing_stats").select("*").limit(1).execute()
    stats = stats_result.data[0] if stats_result.data else {}

    cohorts_result = supabase.table("cohorts").select("*").order("created_at").execute()
    cohorts = cohorts_result.data

    participants_result = supabase.table("participants").select(
        "household_size, pre_program_income, main_breadwinner, age, highest_education, employed_before, employed_before_type"
    ).execute()
    participants = participants_result.data

    pdf = FPDF()
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 12, "Groundbreaker Impact Summary", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, "Generated snapshot of current program data", ln=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(6)

    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "Impact Overview", ln=True)
    pdf.set_font("Helvetica", "", 11)

    stat_lines = [
        ("Participants", stats.get("participants")),
        ("Graduation Rate", f"{stats.get('graduation_rate')}%" if stats.get("graduation_rate") is not None else None),
        ("Employment Rate", f"{stats.get('employment_rate')}%" if stats.get("employment_rate") is not None else None),
        ("Income Growth", f"{stats.get('income_growth_multiplier')}x" if stats.get("income_growth_multiplier") is not None else None),
        ("Active Cohorts", stats.get("cohorts")),
        ("Refugee Inclusion", f"{stats.get('refugee_participants_pct')}%" if stats.get("refugee_participants_pct") is not None else None),
        ("International Roles", f"{stats.get('international_roles_pct')}%" if stats.get("international_roles_pct") is not None else None),
        ("African Companies", f"{stats.get('african_companies_pct')}%" if stats.get("african_companies_pct") is not None else None),
        ("Income Sent Home", f"{stats.get('income_sent_home_pct')}%" if stats.get("income_sent_home_pct") is not None else None),
    ]
    for label, value in stat_lines:
        if value is not None:
            pdf.cell(0, 7, f"{label}: {value}", ln=True)

    pdf.ln(6)

    if cohorts:
        pdf.set_font("Helvetica", "B", 13)
        pdf.cell(0, 8, "Cohort Progress", ln=True)

        chart_bytes = generate_cohort_completion_chart(cohorts)
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(chart_bytes)
            tmp_path = tmp.name
        pdf.image(tmp_path, w=170)
        pdf.ln(4)

    if participants:
        ages = [p["age"] for p in participants if p.get("age") is not None]
        incomes = [p["pre_program_income"] for p in participants if p.get("pre_program_income") is not None]
        household_sizes = [p["household_size"] for p in participants if p.get("household_size") is not None]
        employed_before_count = sum(1 for p in participants if p.get("employed_before") is True)

        pdf.set_font("Helvetica", "B", 13)
        pdf.cell(0, 8, "Baseline (Before the Program)", ln=True)
        pdf.set_font("Helvetica", "", 11)

        if ages:
            pdf.cell(0, 7, f"Average Age: {sum(ages) / len(ages):.1f}", ln=True)
        if incomes:
            pdf.cell(0, 7, f"Average Pre-Program Income: ${sum(incomes) / len(incomes):.2f}/mo", ln=True)
        if household_sizes:
            pdf.cell(0, 7, f"Average Household Size: {sum(household_sizes) / len(household_sizes):.1f}", ln=True)
        pdf.cell(0, 7, f"Employed Before Program: {employed_before_count} of {len(participants)}", ln=True)

    output = pdf.output()
    return bytes(output)
