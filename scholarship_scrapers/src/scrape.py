import json
from typing import Dict, List
import requests

from .config import LARAVEL_API_URL
from .http_client import fetch
from .parser import parse_html
from .source_config import load_sources
from .utils import clean_text


def build_payload(source_name: str, scholarships: List[Dict]) -> Dict:
    return {
        "source": source_name,
        "scholarships": scholarships,
    }


def post_payload(payload: Dict) -> None:
    response = requests.post(LARAVEL_API_URL, json=payload, timeout=20)
    response.raise_for_status()
    print(json.dumps(response.json(), indent=2))


def normalize_item(source, item: Dict) -> Dict:
    return {
        "title": clean_text(item.get("title", "")),
        "description": clean_text(item.get("description", "")),
        "application_url": item.get("application_url") or source.start_url,
        "application_deadline": item.get("application_deadline"),
        "level": source.default_level,
        "type": source.default_type,
        "provider_name": source.provider_name,
        "provider_website": source.provider_website,
    }


def main() -> None:
    sources = load_sources("config/sources.yaml")
    for source in sources:
        print(f"Scraping {source.name}...")
        try:
            html = fetch(source.start_url)
            raw_items = parse_html(html, source.selectors)
            payload_items = []

            for raw in raw_items:
                item = normalize_item(source, raw)
                if not item["title"] or not item["description"]:
                    continue
                if not item["application_deadline"]:
                    print(f"Skipping (no deadline): {item['title']}")
                    continue
                payload_items.append(item)

            if not payload_items:
                print(f"No valid items for {source.name}")
                continue

            payload = build_payload(source.name, payload_items)
            post_payload(payload)
        except Exception as exc:
            print(f"Failed to scrape {source.name}: {exc}")


if __name__ == "__main__":
    main()
