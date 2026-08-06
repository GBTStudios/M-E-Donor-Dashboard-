from enum import Enum


class DocumentStatus(str, Enum):
    PROCESSING = "processing"
    PENDING = "pending"
    PUBLISHED = "published"
    EXCLUDED = "excluded"
