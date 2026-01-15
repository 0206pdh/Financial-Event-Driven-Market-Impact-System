from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.ingest.raw_store import fetch_raw_event, fetch_unprocessed_raw_events, save_raw_events
from app.ingest.apnews import fetch_article_details, fetch_raw_events, get_categories
from app.llm.normalize import normalize_event
from app.rules.engine import score_event
from app.store.db import init_db
from app.store.event_store import (
    fetch_unscored_events,
    graph_edges,
    list_timeline,
    reset_scored_data,
    save_normalized,
    save_scored,
    sector_heatmap,
)

app = FastAPI(title="Event-FX-Sector Intelligence")

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("app.api")

app.mount("/static", StaticFiles(directory="app/ui"), name="static")


@app.on_event("startup")
def _startup() -> None:
    init_db()


@app.get("/")
def index() -> FileResponse:
    return FileResponse("app/ui/index.html")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/categories")
def categories() -> list[dict[str, str]]:
    return get_categories()


@app.get("/news")
def news(category: str, limit: int = 10) -> list[dict[str, str]]:
    try:
        events = fetch_raw_events(category=category, limit_per_category=limit)
    except Exception as exc:
        logger.exception("News fetch failed")
        raise HTTPException(status_code=500, detail=str(exc))
    save_raw_events(events)
    response = []
    for event in events:
        summary = _news_summary(event.payload)
        response.append(
            {
                "id": event.id,
                "title": event.title,
                "url": event.url,
                "published_at": event.published_at.isoformat()
                if hasattr(event.published_at, "isoformat")
                else event.published_at,
                "sector": event.sector,
                "summary": summary,
            }
        )
    return response


@app.post("/ingest/run")
def ingest_run(category: str | None = None, limit_per_category: int = 10) -> dict[str, int]:
    try:
        events = fetch_raw_events(category=category, limit_per_category=limit_per_category)
    except Exception as exc:
        logger.exception("Ingestion failed")
        raise HTTPException(status_code=500, detail=str(exc))
    inserted = save_raw_events(events)
    logger.info("Ingestion complete fetched=%s inserted=%s", len(events), inserted)
    return {"fetched": len(events), "inserted": inserted}


@app.post("/events/normalize")
def normalize_events(limit: int = 50) -> dict[str, int]:
    raw_events = fetch_unprocessed_raw_events(limit=limit)
    count = 0
    for raw in raw_events:
        normalized = normalize_event(raw)
        save_normalized(normalized)
        count += 1
    logger.info("Normalization complete normalized=%s", count)
    return {"normalized": count}


@app.post("/events/score")
def score_events(limit: int = 50) -> dict[str, int]:
    normalized_events = fetch_unscored_events(limit=limit)
    count = 0
    for normalized in normalized_events:
        scored = score_event(normalized)
        save_scored(scored)
        count += 1
    logger.info("Scoring complete scored=%s", count)
    return {"scored": count}


@app.post("/pipeline/run")
def pipeline_run(category: str | None = None, limit_per_category: int = 10, limit: int = 50) -> dict[str, int]:
    try:
        events = fetch_raw_events(category=category, limit_per_category=limit_per_category)
    except Exception as exc:
        logger.exception("Pipeline ingestion failed")
        raise HTTPException(status_code=500, detail=str(exc))
    inserted = save_raw_events(events)

    raw_events = fetch_unprocessed_raw_events(limit=limit)
    normalized_count = 0
    for raw in raw_events:
        normalized = normalize_event(raw)
        save_normalized(normalized)
        normalized_count += 1

    normalized_events = fetch_unscored_events(limit=limit)
    scored_count = 0
    for normalized in normalized_events:
        scored = score_event(normalized)
        save_scored(scored)
        scored_count += 1

    logger.info(
        "Pipeline complete fetched=%s inserted=%s normalized=%s scored=%s",
        len(events),
        inserted,
        normalized_count,
        scored_count,
    )
    return {
        "fetched": len(events),
        "inserted": inserted,
        "normalized": normalized_count,
        "scored": scored_count,
    }


@app.post("/pipeline/run_one")
def pipeline_run_one(raw_event_id: str) -> dict[str, int]:
    raw_event = fetch_raw_event(raw_event_id)
    if not raw_event:
        raise HTTPException(status_code=404, detail="Raw event not found")
    reset_scored_data()
    try:
        details = fetch_article_details(raw_event.url)
    except Exception as exc:
        logger.warning("AP article details fetch failed: %s", exc)
        details = {}
    if details:
        raw_event.payload["details"] = {
            "title": details.get("title", ""),
            "summary": details.get("summary", ""),
            "text": details.get("text", ""),
        }
        if details.get("published_at"):
            raw_event.payload["item"]["published_at"] = details.get("published_at", "")
        if details.get("title"):
            raw_event.title = details.get("title", raw_event.title)
    normalized = normalize_event(raw_event)
    save_normalized(normalized)
    scored = score_event(normalized)
    save_scored(scored)
    logger.info("Pipeline single complete raw_event_id=%s", raw_event_id)
    return {"normalized": 1, "scored": 1}


@app.get("/timeline")
def timeline(limit: int = 50) -> list[dict[str, object]]:
    return list_timeline(limit=limit)


@app.get("/heatmap")
def heatmap() -> dict[str, int]:
    return sector_heatmap()


@app.get("/graph")
def graph(limit: int = 100) -> list[dict[str, object]]:
    return graph_edges(limit=limit)


def _news_summary(payload: dict) -> str:
    if not isinstance(payload, dict):
        return ""
    details = payload.get("details")
    item = payload.get("item")
    fields = ["summary", "description", "headline", "title", "body", "content", "text"]
    for source in (details, item):
        if isinstance(source, dict):
            for key in fields:
                value = source.get(key)
                if value:
                    return str(value)[:240]
    return ""
