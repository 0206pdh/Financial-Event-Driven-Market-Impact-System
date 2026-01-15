from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class RawEvent(BaseModel):
    id: str
    title: str
    url: str
    published_at: datetime
    sector: str
    source: str
    payload: dict[str, Any] = Field(default_factory=dict)


class NormalizedEvent(BaseModel):
    raw_event_id: str
    event_type: str
    policy_domain: str
    risk_signal: str
    rate_signal: str
    geo_signal: str
    sector_impacts: dict[str, int]
    sentiment: str
    rationale: str


class ScoredEvent(BaseModel):
    raw_event_id: str
    event_type: str
    policy_domain: str
    risk_signal: str
    rate_signal: str
    geo_signal: str
    sector_impacts: dict[str, int]
    sentiment: str
    rationale: str
    fx_state: str
    sector_scores: dict[str, int]
    total_score: int
    created_at: datetime
