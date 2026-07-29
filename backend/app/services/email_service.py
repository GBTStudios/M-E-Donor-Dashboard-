import random
import resend
from datetime import datetime, timedelta, timezone

from app.core.config import settings

resend.api_key = settings.resend_api_key


def generate_verification_code() -> str:
    return str(random.randint(100000, 999999))


def send_verification_email(to_email: str, code: str) -> None:
    resend.Emails.send({
        "from": "Groundbreaker Donor Dashboard <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "Verify your email — Groundbreaker Donor Dashboard",
        "html": f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>Verify your email</h2>
                <p>Use the code below to verify your account:</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">{code}</p>
                <p>This code expires in 15 minutes.</p>
                <p>If you didn't request this, you can safely ignore this email.</p>
            </div>
        """
    })
