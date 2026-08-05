import httpx

PRIVATE_IP_PREFIXES = ("127.", "10.", "192.168.", "::1")


def is_private_ip(ip: str) -> bool:
    if not ip:
        return True
    if ip.startswith(PRIVATE_IP_PREFIXES):
        return True
    if ip.startswith("172."):
        try:
            second_octet = int(ip.split(".")[1])
            if 16 <= second_octet <= 31:
                return True
        except (IndexError, ValueError):
            pass
    return False


def get_location_from_ip(ip: str) -> str | None:
    """Returns 'City, CC' or None if the IP is local/private or lookup fails."""
    if is_private_ip(ip):
        return None

    try:
        response = httpx.get(f"http://ip-api.com/json/{ip}", timeout=3.0)
        data = response.json()

        if data.get("status") == "success":
            city = data.get("city", "")
            country_code = data.get("countryCode", "")
            if city and country_code:
                return f"{city}, {country_code}"
            elif country_code:
                return country_code

        return None
    except Exception:
        # Never let a geolocation failure break login
        return None
