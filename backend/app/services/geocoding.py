import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


def geocode_district(district: str, country: str = "Uganda") -> tuple[float, float] | None:
    """Free, no-API-key geocoding via OpenStreetMap Nominatim.
    Returns (lat, lon) or None if not found. Rate-limited to 1 request/sec by
    Nominatim's usage policy - do not call this in a tight loop without delay."""
    response = httpx.get(
        NOMINATIM_URL,
        params={"q": f"{district}, {country}", "format": "json", "limit": 1},
        headers={"User-Agent": "GroundbreakerDonorDashboard/1.0"},
        timeout=10,
    )
    results = response.json()
    if not results:
        return None
    return float(results[0]["lat"]), float(results[0]["lon"])
