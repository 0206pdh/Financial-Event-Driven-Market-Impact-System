from __future__ import annotations

FX_BIAS_RULES = {
    "risk_off": {"USD": 2, "JPY": 2, "EUR": -1, "EM": -2},
    "risk_on": {"USD": -2, "JPY": -2, "EUR": 1, "EM": 2},
    "rate_tightening": {"USD": 2, "JPY": 0, "EUR": 0, "EM": -1},
    "rate_easing": {"USD": -2, "JPY": 0, "EUR": 0, "EM": 1},
    "geo_escalation": {"USD": 1, "JPY": 1, "EUR": 0, "EM": -1},
    "geo_deescalation": {"USD": -1, "JPY": -1, "EUR": 0, "EM": 1},
}

FX_SECTOR_RULES = {
    "USD_up": {
        "Energy": 1,
        "Defense": 1,
        "Financials": 1,
        "Technology": -1,
        "Consumer Discretionary": -1,
    },
    "USD_down": {
        "Technology": 1,
        "Consumer Discretionary": 1,
        "Growth": 1,
        "Financials": -1,
    },
    "JPY_up": {
        "Defense": 1,
        "Autos": -1,
    },
    "EUR_up": {
        "Industrials": 1,
        "Energy": -1,
    },
    "EM_up": {
        "Materials": 1,
        "Industrials": 1,
        "Utilities": -1,
    },
}

RISK_SECTOR_RULES = {
    "risk_off": {
        "Defense": 2,
        "Energy": 2,
        "Utilities": 2,
        "Technology": -2,
        "Consumer Discretionary": -2,
    },
    "risk_on": {
        "Technology": 2,
        "Consumer Discretionary": 2,
        "Industrials": 2,
        "Defense": -2,
    },
}
