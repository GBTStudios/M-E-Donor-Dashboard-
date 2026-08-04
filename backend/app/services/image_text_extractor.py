import base64

from openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.openai_api_key)


def extract_text_from_image(image_bytes: bytes, mime_type: str = "image/png") -> str:
    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract any readable text from this image. If there is no readable text, respond with exactly: NO_TEXT_FOUND",
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{b64_image}"},
                    },
                ],
            }
        ],
        temperature=0,
    )

    result = response.choices[0].message.content.strip()
    return "" if result == "NO_TEXT_FOUND" else result