import io


def generate_cohort_completion_chart(cohorts: list[dict]) -> bytes:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    names = [c["name"] for c in cohorts]
    completion = [c["completion_pct"] for c in cohorts]

    fig, ax = plt.subplots(figsize=(6, 3.5))
    bars = ax.barh(names, completion, color="#1a5c4a")
    ax.set_xlim(0, 100)
    ax.set_xlabel("Completion %")
    ax.set_title("Cohort Progress")

    for bar, value in zip(bars, completion):
        ax.text(value + 1, bar.get_y() + bar.get_height() / 2, f"{value:.0f}%", va="center", fontsize=8)

    fig.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150)
    plt.close(fig)
    buf.seek(0)
    return buf.read()
