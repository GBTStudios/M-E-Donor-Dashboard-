import random

from sib_api_v3_sdk import Configuration, ApiClient, TransactionalEmailsApi, SendSmtpEmail
from sib_api_v3_sdk.rest import ApiException as BrevoApiException

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from app.core.config import settings


def generate_verification_code() -> str:
    return str(random.randint(100000, 999999))


def _send_via_brevo(to_email: str, subject: str, html: str) -> None:
    config = Configuration()
    config.api_key["api-key"] = settings.brevo_api_key
    api_client = ApiClient(config)
    api_instance = TransactionalEmailsApi(api_client)

    email = SendSmtpEmail(
        to=[{"email": to_email}],
        sender={"email": settings.sender_email, "name": settings.sender_name},
        subject=subject,
        html_content=html,
    )

    api_instance.send_transac_email(email)


def _send_via_sendgrid(to_email: str, subject: str, html: str) -> None:
    message = Mail(
        from_email=settings.sender_email,
        to_emails=to_email,
        subject=subject,
        html_content=html,
    )
    sg = SendGridAPIClient(settings.sendgrid_api_key)
    response = sg.send(message)

    if response.status_code >= 300:
        raise Exception(f"SendGrid returned status {response.status_code}")


def send_email(to_email: str, subject: str, html: str) -> None:
    """Try Brevo first (primary, permanent free tier). Fall back to SendGrid if Brevo fails."""
    try:
        _send_via_brevo(to_email, subject, html)
    except Exception as e:
        print(f"Brevo send failed, falling back to SendGrid: {e}")
        try:
            _send_via_sendgrid(to_email, subject, html)
        except Exception as e2:
            print(f"SendGrid fallback also failed: {e2}")
            raise


def send_verification_email(to_email: str, code: str) -> None:
    html = f"""
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Verify your email</h2>
            <p>Use the code below to verify your account:</p>
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">{code}</p>
            <p>This code expires in 15 minutes.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
    """
    send_email(to_email, "Verify your email — Groundbreaker Donor Dashboard", html)


def send_password_reset_email(to_email: str, code: str) -> None:
    html = f"""
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>Use the code below to reset your password:</p>
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">{code}</p>
            <p>This code expires in 30 minutes.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
    """
    send_email(to_email, "Reset your password — Groundbreaker Donor Dashboard", html)



def send_admin_welcome_email(to_email: str, full_name: str, temp_password: str) -> None:
    html = f"""
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Welcome to Groundbreaker Donor Dashboard</h2>
            <p>Hi {full_name},</p>
            <p>An admin account has been created for you. Use the credentials below to log in:</p>
            <p><strong>Email:</strong> {to_email}</p>
            <p><strong>Temporary password:</strong></p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">{temp_password}</p>
            <p>You will be asked to set your own password the first time you log in.</p>
            <p>If you weren't expecting this account, please contact your administrator.</p>
        </div>
    """
    send_email(to_email, "Your admin account is ready — Groundbreaker Donor Dashboard", html)
