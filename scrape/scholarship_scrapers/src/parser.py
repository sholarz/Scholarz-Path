import html
import re
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
from .utils import clean_text, find_date_in_text


def _extract_text(node, selector: str) -> str:
    if selector == "text":
        return clean_text(node.get_text(" "))
    if selector.startswith("text_before:"):
        marker = selector.split(":", 1)[1]
        text = clean_text(node.get_text(" "))
        return clean_text(text.split(marker)[0])
    if "@" in selector:
        target_selector, attr_name = selector.split("@", 1)
        target = node.select_one(target_selector)
        if not target:
            return ""
        raw_value = target.get(attr_name, "")
        if not raw_value:
            return ""
        unescaped = html.unescape(raw_value)
        text = BeautifulSoup(unescaped, "html.parser").get_text(" ")
        return clean_text(text)
    target = node.select_one(selector)
    if not target:
        return ""
    return clean_text(target.get_text(" "))


def _extract_link(node, selector: str) -> Optional[str]:
    if selector.startswith("link_text:"):
        label = selector.split(":", 1)[1]
        link = node.find("a", string=re.compile(label, re.IGNORECASE))
        return link.get("href") if link else None
    link = node.select_one(selector)
    if not link:
        return None
    return link.get("href")


def _extract_deadline(text: str, regex_value: Optional[str]) -> Optional[str]:
    if not text:
        return None
    if regex_value:
        match = re.search(regex_value, text, flags=re.IGNORECASE)
        if match:
            return find_date_in_text(match.group(match.lastindex))
    return find_date_in_text(text)


def parse_html(html: str, selectors: Dict[str, str]) -> List[Dict]:
    soup = BeautifulSoup(html, "html.parser")
    items = []

    item_selector = selectors.get("item", "body")
    for node in soup.select(item_selector):
        title_selector = selectors.get("title", "")
        description_selector = selectors.get("description", "")
        link_selector = selectors.get("link", "a")
        deadline_selector = selectors.get("deadline", "")
        deadline_regex = selectors.get("deadline_regex")

        title = _extract_text(node, title_selector) if title_selector else ""
        description = _extract_text(node, description_selector) if description_selector else ""
        application_url = _extract_link(node, link_selector)
        if deadline_selector:
            deadline_text = _extract_text(node, deadline_selector)
            deadline = _extract_deadline(deadline_text, deadline_regex)
        else:
            deadline = _extract_deadline(description or title, deadline_regex)

        if not title:
            continue

        items.append(
            {
                "title": title,
                "description": description,
                "application_url": application_url,
                "application_deadline": deadline,
            }
        )

    return items
