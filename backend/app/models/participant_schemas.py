from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class ImportUploadResponse(BaseModel):
    id: str
    filename: str
    status: str


class ImportStatusResponse(BaseModel):
    id: str
    filename: str
    status: str
    row_count: Optional[int] = None
    preview_data: Optional[Dict[str, Any]] = None


class ImportActionResponse(BaseModel):
    message: str
    id: str
    rows_imported: Optional[int] = None


class BaselineResponse(BaseModel):
    avg_household_size: Optional[float] = None
    avg_pre_program_income: Optional[float] = None
    main_breadwinner_breakdown: Dict[str, int]
    avg_age: Optional[float] = None
    highest_education_common: Optional[str] = None
    employed_before_pct: Optional[float] = None
    employed_before_type_common: Optional[str] = None


class DistrictCount(BaseModel):
    district: str
    participant_count: int


class CountryCount(BaseModel):
    country: str
    participant_count: int


class OriginsResponse(BaseModel):
    uganda_districts: List[DistrictCount]
    international: List[CountryCount]
