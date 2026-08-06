from pydantic import BaseModel


class CohortOut(BaseModel):
    id: str
    name: str
    active_participants: int
    completion_pct: float
    status: str
