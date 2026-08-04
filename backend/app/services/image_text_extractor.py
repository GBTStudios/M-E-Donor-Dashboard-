import base64

from anthropic import Anthropic
from app.core.config import settings

client = Anthropic(api_key=settings.anthropic_api_key)


def extract_text_from_image(image_bytes: bytes, mime_type: str = "image/png") -> str:
    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": mime_type,
                            "data": b64_image,
                        },
                    },
                    {
                        "type": "text",
                        "text": "Extract any readable text from this image. If there is no readable text, respond with exactly: NO_TEXT_FOUND",
                    },
                ],
            }
        ],
    )

    result = response.content[0].text.strip()
    return "" if result == "NO_TEXT_FOUND" else result