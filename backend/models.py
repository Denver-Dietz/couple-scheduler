"""
Pydantic data models for FastAPI request and response validation.
Why:
- Defines the expected schema for all API endpoints, providing automatic validation, serialization,
  and interactive API documentation (via Swagger UI).
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class Setting(BaseModel):
    key: str
    value: Any

class Commitment(BaseModel):
    id: str
    user_id: Optional[str] = None
    title: str
    start_time: str
    end_time: str
    is_fixed: bool = True
    raw_text: Optional[str] = None

class Goal(BaseModel):
    id: str
    title: str
    duration_minutes: int
    target_per_week: int
    preferred_time_of_day: Optional[str] = None

class Project(BaseModel):
    id: str
    title: str
    total_hours: int
    hours_allocated: int = 0
    deadline: Optional[str] = None

class ScheduleRequest(BaseModel):
    start_date: str
    end_date: str

class ScheduleResponse(BaseModel):
    id: str
    start_date: str
    end_date: str
    schedule_json: str

class CheckInResponse(BaseModel):
    id: str
    checkin_id: str
    user_id: str
    communication_score: int
    intimacy_score: int
    quality_time_score: int
    teamwork_score: int
    notes: Optional[str] = None
    submitted_at: str

class CheckIn(BaseModel):
    id: str
    couple_id: str
    month_year: str
    status: str
    responses: Optional[List[CheckInResponse]] = None

class CheckInSubmitRequest(BaseModel):
    communication_score: int
    intimacy_score: int
    quality_time_score: int
    teamwork_score: int
    notes: Optional[str] = None

class MemoryCommentSubmit(BaseModel):
    user_id: str
    comment_text: str

class MemoryReactionSubmit(BaseModel):
    user_id: str
    reaction_type: str


class TripCreate(BaseModel):
    name: str
    dates: Optional[str] = None
    destination: Optional[str] = None
    cover_photo: Optional[str] = None
    mood_tags: Optional[str] = None
    progress: int = 0

class TripUpdate(BaseModel):
    name: Optional[str] = None
    dates: Optional[str] = None
    destination: Optional[str] = None
    cover_photo: Optional[str] = None
    mood_tags: Optional[str] = None
    progress: Optional[int] = None

class TripItineraryCreate(BaseModel):
    day: str
    title: str
    time: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    partner_id: str

class TripItineraryUpdate(BaseModel):
    day: Optional[str] = None
    title: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class TripWishlistCreate(BaseModel):
    title: str
    category: Optional[str] = None
    partner_id: str

class TripBudgetCreate(BaseModel):
    category: str
    estimated: float = 0
    actual: float = 0
    paid_by: Optional[str] = None

class TripBudgetUpdate(BaseModel):
    category: Optional[str] = None
    estimated: Optional[float] = None
    actual: Optional[float] = None
    paid_by: Optional[str] = None

class TripLogisticsCreate(BaseModel):
    type: str
    details: str
    files: Optional[str] = None

class TripLogisticsUpdate(BaseModel):
    details: Optional[str] = None
    files: Optional[str] = None

class TripMapItemCreate(BaseModel):
    coordinates: str
    category: str
    linked_itinerary_item_id: Optional[str] = None


class BucketListCreate(BaseModel):
    item_type: str
    title: str
    estimated_cost: Optional[str] = None
    effort_level: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    cover_image_url: Optional[str] = None

class BucketListUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    estimated_cost: Optional[str] = None
    effort_level: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None

class BucketListLinkCreate(BaseModel):
    url: str

