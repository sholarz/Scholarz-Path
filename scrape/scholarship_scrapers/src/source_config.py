from dataclasses import dataclass
from typing import Dict, List, Optional
import yaml


@dataclass
class SourceConfig:
    name: str
    start_url: str
    provider_name: str
    provider_website: Optional[str]
    default_level: str
    default_type: str
    selectors: Dict[str, str]


def load_sources(path: str) -> List[SourceConfig]:
    with open(path, "r", encoding="utf-8") as handle:
        payload = yaml.safe_load(handle) or {}
    sources = []
    for entry in payload.get("sources", []):
        sources.append(
            SourceConfig(
                name=entry["name"],
                start_url=entry["start_url"],
                provider_name=entry["provider_name"],
                provider_website=entry.get("provider_website"),
                default_level=entry.get("default_level", "bachelor"),
                default_type=entry.get("default_type", "academic"),
                selectors=entry.get("selectors", {}),
            )
        )
    return sources
