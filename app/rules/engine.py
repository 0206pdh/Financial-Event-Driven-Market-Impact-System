from __future__ import annotations

from datetime import datetime

from app.models import NormalizedEvent, ScoredEvent
from app.rules.weights import FX_BIAS_RULES, FX_SECTOR_RULES, RISK_SECTOR_RULES


def score_event(event: NormalizedEvent) -> ScoredEvent:
    fx_bias = _derive_fx_bias(event.risk_signal, event.rate_signal, event.geo_signal)
    fx_state = _format_fx_state(fx_bias)
    fx_signals = _derive_fx_signals(fx_bias)
    sector_scores: dict[str, int] = {}
    risk_key = event.risk_signal.lower()
    for sector, score in RISK_SECTOR_RULES.get(risk_key, {}).items():
        sector_scores[sector] = sector_scores.get(sector, 0) + score

    for signal in fx_signals:
        for sector, score in FX_SECTOR_RULES.get(signal, {}).items():
            sector_scores[sector] = sector_scores.get(sector, 0) + score

    for sector, score in event.sector_impacts.items():
        event_weight = _event_weight(score)
        if event_weight:
            sector_scores[sector] = sector_scores.get(sector, 0) + event_weight

    total_score = sum(sector_scores.values())

    return ScoredEvent(
        raw_event_id=event.raw_event_id,
        event_type=event.event_type,
        policy_domain=event.policy_domain,
        risk_signal=event.risk_signal,
        rate_signal=event.rate_signal,
        geo_signal=event.geo_signal,
        sector_impacts=event.sector_impacts,
        sentiment=event.sentiment,
        rationale=event.rationale,
        fx_state=fx_state,
        sector_scores=sector_scores,
        total_score=total_score,
        created_at=datetime.utcnow(),
    )


def _derive_fx_bias(risk_signal: str, rate_signal: str, geo_signal: str) -> dict[str, int]:
    bias = {"USD": 0, "JPY": 0, "EUR": 0, "EM": 0}
    risk_key = risk_signal.lower()
    rate_key = rate_signal.lower()
    geo_key = geo_signal.lower()

    for key in (risk_key, _rate_key(rate_key), _geo_key(geo_key)):
        if not key:
            continue
        for currency, score in FX_BIAS_RULES.get(key, {}).items():
            bias[currency] += score
    return bias


def _rate_key(value: str) -> str | None:
    if value == "tightening":
        return "rate_tightening"
    if value == "easing":
        return "rate_easing"
    return None


def _geo_key(value: str) -> str | None:
    if value == "escalation":
        return "geo_escalation"
    if value == "deescalation":
        return "geo_deescalation"
    return None


def _derive_fx_signals(bias: dict[str, int]) -> list[str]:
    signals: list[str] = []
    usd = bias.get("USD", 0)
    jpy = bias.get("JPY", 0)
    eur = bias.get("EUR", 0)
    em = bias.get("EM", 0)

    if usd > 0:
        signals.append("USD_up")
    elif usd < 0:
        signals.append("USD_down")
    if jpy > 0:
        signals.append("JPY_up")
    if eur > 0:
        signals.append("EUR_up")
    if em > 0:
        signals.append("EM_up")
    return signals


def _format_fx_state(bias: dict[str, int]) -> str:
    return " ".join(
        [
            f"USD:{bias.get('USD', 0):+d}",
            f"JPY:{bias.get('JPY', 0):+d}",
            f"EUR:{bias.get('EUR', 0):+d}",
            f"EM:{bias.get('EM', 0):+d}",
        ]
    )


def _event_weight(value: int | float) -> int:
    if value > 0:
        return 1
    if value < 0:
        return -1
    return 0
