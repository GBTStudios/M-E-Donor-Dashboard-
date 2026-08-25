import io
from PIL import Image

OUTPUT_SIZE = 512  # final square dimension, px
FACE_PADDING_FACTOR = 1.8  # how much wider than the detected face the crop box is

_face_cascade = None


def _get_face_cascade():
    global _face_cascade
    if _face_cascade is None:
        import cv2
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        _face_cascade = cv2.CascadeClassifier(cascade_path)
    return _face_cascade


def _detect_largest_face(image: Image.Image):
    """Returns (center_x, center_y, box_size) of the largest detected face,
    or None if no face was found. Runs on a grayscale copy - detection
    quality only, not used for the actual crop."""
    import cv2
    import numpy as np

    gray = cv2.cvtColor(np.array(image.convert("RGB")), cv2.COLOR_RGB2GRAY)
    cascade = _get_face_cascade()
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
    if len(faces) == 0:
        return None
    # Largest detected face by area - most likely the primary subject.
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    center_x = x + w / 2
    center_y = y + h / 2
    box_size = max(w, h) * FACE_PADDING_FACTOR
    return center_x, center_y, box_size


def _center_crop_box(image: Image.Image):
    """Plain geometric center of the whole image, sized to the smaller
    dimension - used when no face is detected."""
    width, height = image.size
    box_size = min(width, height)
    return width / 2, height / 2, box_size


def crop_profile_photo(image_bytes: bytes, output_format: str = "JPEG") -> bytes:
    """
    Always crops the uploaded photo to a centered square, applied to every
    upload regardless of what the frontend does. Tries face-detection first
    (crops centered on the largest detected face); falls back to a plain
    geometric center crop if no face is found. Final image is resized to a
    consistent OUTPUT_SIZE so every stored profile photo is uniform.
    """
    image = Image.open(io.BytesIO(image_bytes))
    image = image.convert("RGB") if output_format == "JPEG" else image
    face_box = _detect_largest_face(image)
    center_x, center_y, box_size = face_box if face_box else _center_crop_box(image)
    width, height = image.size
    half = box_size / 2
    left = center_x - half
    top = center_y - half
    right = center_x + half
    bottom = center_y + half
    if left < 0:
        right -= left
        left = 0
    if top < 0:
        bottom -= top
        top = 0
    if right > width:
        left -= (right - width)
        right = width
    if bottom > height:
        top -= (bottom - height)
        bottom = height
    left = max(0, left)
    top = max(0, top)
    cropped = image.crop((int(left), int(top), int(right), int(bottom)))
    resized = cropped.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.LANCZOS)
    output = io.BytesIO()
    resized.save(output, format=output_format, quality=90 if output_format == "JPEG" else None)
    return output.getvalue()
