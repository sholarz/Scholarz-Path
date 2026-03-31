import re
from datetime import datetime
from typing import Optional
from dateutil import parser as date_parser

_INDONESIAN_MONTHS = {
    "januari": "January",
    "februari": "February",
    "maret": "March",
    "april": "April",
    "mei": "May",
    "juni": "June",
    "juli": "July",
    "agustus": "August",
    "september": "September",
    "oktober": "October",
    "november": "November",
    "desember": "December",
}


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def _normalize_months(value: str) -> str:
    if not value:
        return ""
    normalized = value
    for indo, eng in _INDONESIAN_MONTHS.items():
        normalized = re.sub(rf"\b{indo}\b", eng, normalized, flags=re.IGNORECASE)
    return normalized


def parse_date(value: str) -> Optional[str]:
    if not value:
        return None
    try:
        normalized = _normalize_months(value)
        normalized = normalized.replace("–", "-")
        parsed = date_parser.parse(normalized, fuzzy=True, dayfirst=True)
        return parsed.date().isoformat()
    except Exception:
        return None


def find_date_in_text(value: str) -> Optional[str]:
    if not value:
        return None

    normalized = _normalize_months(value)
    date_pattern = re.compile(
        r"(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})",
        flags=re.IGNORECASE,
    )
    matches = date_pattern.findall(normalized)
    if matches:
        last = " ".join(matches[-1])
        parsed = parse_date(last)
        if parsed:
            return parsed

    return parse_date(normalized)


def now_iso() -> str:
    return datetime.utcnow().isoformat()
