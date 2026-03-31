from dataclasses import dataclass
import re
from typing import Callable, Dict, List, Optional
from bs4 import BeautifulSoup
from .utils import clean_text, find_date_in_text


@dataclass
class Source:
    name: str
    start_url: str
    provider_name: str
    provider_website: Optional[str]
    default_level: str
    default_type: str
    parse: Callable[[str], List[Dict]]


def parse_ut(html: str) -> List[Dict]:
    soup = BeautifulSoup(html, "html.parser")
    items = []
    titles = soup.select("h3.elementor-heading-title")
    descriptions = soup.select("p.elementor-text-editor")
    for idx, title_node in enumerate(titles):
        title = clean_text(title_node.get_text())
        description = clean_text(descriptions[idx].get_text()) if idx < len(descriptions) else ""
        deadline = find_date_in_text(description)
        items.append({
            "title": title,
            "description": description,
            "application_url": None,
            "application_deadline": deadline,
        })
    return items


def parse_unpad(html: str) -> List[Dict]:
    soup = BeautifulSoup(html, "html.parser")
    items = []
    for post in soup.select("article"):
        title_node = post.select_one(".wp-block-post-title")
        description_node = post.select_one(".wp-block-post-excerpt")
        link_node = post.select_one("a")
        title = clean_text(title_node.get_text()) if title_node else ""
        description = clean_text(description_node.get_text()) if description_node else ""
        deadline = find_date_in_text(description)
        items.append({
            "title": title,
            "description": description,
            "application_url": link_node.get("href") if link_node else None,
            "application_deadline": deadline,
        })
    return items


def parse_upertamina(html: str) -> List[Dict]:
    soup = BeautifulSoup(html, "html.parser")
    items = []
    deadline_pattern = re.compile(r"Batas\s+Pendaftaran\s*:\s*([^\n]+)", re.IGNORECASE)

    for node in soup.select("body *"):
        text = clean_text(node.get_text(" "))
        if "Batas Pendaftaran" not in text:
            continue

        match = deadline_pattern.search(text)
        if not match:
            continue

        deadline = find_date_in_text(match.group(1))
        title = clean_text(text.split("Batas Pendaftaran")[0])
        link_node = node.find("a", string=re.compile(r"Formulir", re.IGNORECASE))
        application_url = link_node.get("href") if link_node else None

        if title:
            items.append({
                "title": title,
                "description": text,
                "application_url": application_url,
                "application_deadline": deadline,
            })
    return items


SOURCES: List[Source] = [
    Source(
        name="ut",
        start_url="https://www.ut.ac.id/beasiswa/",
        provider_name="Universitas Terbuka",
        provider_website="https://www.ut.ac.id",
        default_level="bachelor",
        default_type="academic",
        parse=parse_ut,
    ),
    Source(
        name="unpad",
        start_url="https://beasiswa.unpad.ac.id/",
        provider_name="Universitas Padjadjaran",
        provider_website="https://www.unpad.ac.id",
        default_level="bachelor",
        default_type="academic",
        parse=parse_unpad,
    ),
    Source(
        name="upertamina",
        start_url="https://universitaspertamina.ac.id/mahasiswa/daftar-beasiswa",
        provider_name="Universitas Pertamina",
        provider_website="https://universitaspertamina.ac.id",
        default_level="bachelor",
        default_type="academic",
        parse=parse_upertamina,
    ),
]
