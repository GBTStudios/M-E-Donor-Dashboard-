from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    resend_api_key: str
    brevo_api_key: str
    sendgrid_api_key: str
    sender_email: str
    sender_name: str = "Groundbreaker Donor Dashboard"

    class Config:
        env_file = ".env"

settings = Settings()
