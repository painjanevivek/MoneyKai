from __future__ import annotations

import asyncio
import hashlib
import html
import re
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any
from xml.etree import ElementTree as ET

import httpx

NEWS_CACHE_TTL_SECONDS = 30 * 60
DEFAULT_NEWS_LIMIT = 15
MAX_NEWS_LIMIT = 20

NEWS_FEEDS: list[dict[str, str]] = [
    {
        "name": "TechCrunch Fintech",
        "url": "https://techcrunch.com/tag/fintech/feed/",
        "category": "fintech",
    },
    {
        "name": "TechCrunch Financial Services",
        "url": "https://techcrunch.com/tag/financial-services/feed/",
        "category": "finance",
    },
    {
        "name": "Finextra Payments",
        "url": "https://www.finextra.com/rss/channel.aspx?channel=payments",
        "category": "fintech",
    },
    {
        "name": "Finextra Headlines",
        "url": "https://www.finextra.com/rss/headlines.aspx",
        "category": "finance",
    },
]

FINTECH_KEYWORDS = (
    "fintech",
    "payment",
    "payments",
    "banking",
    "bank",
    "wallet",
    "neobank",
    "lending",
    "loan",
    "credit",
    "debit",
    "card",
    "cards",
    "remittance",
    "open banking",
    "upi",
    "bnpl",
    "fraud",
    "money transfer",
    "merchant",
    "digital banking",
)

FINANCE_KEYWORDS = (
    "finance",
    "markets",
    "market",
    "stocks",
    "stock",
    "fed",
    "rates",
    "rate",
    "interest",
    "inflation",
    "economy",
    "economic",
    "investing",
    "investment",
    "ipo",
    "bond",
    "bonds",
    "earnings",
    "portfolio",
    "wealth",
    "savings",
    "personal finance",
    "budget",
    "budgeting",
)

ATOM_NS = "{http://www.w3.org/2005/Atom}"
MEDIA_NS = "{http://search.yahoo.com/mrss/}"

NEWS_CACHE: dict[str, Any] = {
    "fetched_at": 0.0,
    "items": [],
}


class NewsServiceError(RuntimeError):
    pass


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _clean_text(value: str | None) -> str:
    if not value:
        return ""
    text = html.unescape(re.sub(r"<[^>]+>", " ", value))
    return re.sub(r"\s+", " ", text).strip()


def _truncate(text: str, limit: int = 240) -> str:
    if len(text) <= limit:
        return text
    return f"{text[: limit - 1].rstrip()}..."


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    parsed: datetime | None = None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        try:
            parsed = parsedate_to_datetime(value)
        except (TypeError, ValueError):
            parsed = None

    if parsed is None:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _to_iso(value: datetime | None) -> str:
    return (value or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _source_category_label(value: str) -> str:
    return "Fintech" if value == "fintech" else "Finance"


def _classify_article(title: str, description: str, fallback: str) -> str:
    haystack = f"{title} {description}".lower()
    if any(keyword in haystack for keyword in FINTECH_KEYWORDS):
        return "fintech"
    if any(keyword in haystack for keyword in FINANCE_KEYWORDS):
        return "finance"
    return fallback if fallback in {"finance", "fintech"} else "finance"


def _article_id(url: str, title: str, published_at: str) -> str:
    digest = hashlib.sha1(f"{url}|{title}|{published_at}".encode("utf-8")).hexdigest()
    return digest[:16]


def _extract_item_link(item: ET.Element) -> str:
    link = _clean_text(item.findtext("link"))
    if link:
        return link

    for link_node in item.findall(f"{ATOM_NS}link"):
        href = link_node.attrib.get("href", "").strip()
        rel = link_node.attrib.get("rel", "alternate")
        if href and rel in {"alternate", ""}:
            return href
    return ""


def _extract_item_image(item: ET.Element) -> str | None:
    enclosure = item.find("enclosure")
    if enclosure is not None:
        url = enclosure.attrib.get("url", "").strip()
        if url:
            return url

    media_content = item.find(f"{MEDIA_NS}content")
    if media_content is not None:
        url = media_content.attrib.get("url", "").strip()
        if url:
            return url

    media_thumbnail = item.find(f"{MEDIA_NS}thumbnail")
    if media_thumbnail is not None:
        url = media_thumbnail.attrib.get("url", "").strip()
        if url:
            return url

    return None


def _parse_feed_items(xml_text: str, feed_name: str, fallback_category: str) -> list[dict[str, Any]]:
    root = ET.fromstring(xml_text)
    parsed_items: list[dict[str, Any]] = []

    if root.tag.endswith("rss"):
        nodes = root.findall("./channel/item")
    elif root.tag.endswith("feed"):
        nodes = root.findall(f".//{ATOM_NS}entry")
    else:
        nodes = []

    for item in nodes:
        if root.tag.endswith("feed"):
            title = _clean_text(item.findtext(f"{ATOM_NS}title"))
            description = _clean_text(item.findtext(f"{ATOM_NS}summary")) or _clean_text(item.findtext(f"{ATOM_NS}content"))
            published_raw = _clean_text(item.findtext(f"{ATOM_NS}published")) or _clean_text(item.findtext(f"{ATOM_NS}updated"))
            link = _extract_item_link(item)
            image = _extract_item_image(item)
        else:
            title = _clean_text(item.findtext("title"))
            description = _clean_text(item.findtext("description")) or _clean_text(item.findtext("summary"))
            published_raw = _clean_text(item.findtext("pubDate")) or _clean_text(item.findtext("published"))
            link = _extract_item_link(item)
            image = _extract_item_image(item)

        if not title or not link:
            continue

        category = _classify_article(title, description, fallback_category)
        published_at = _to_iso(_parse_datetime(published_raw))
        parsed_items.append(
            {
                "id": _article_id(link, title, published_at),
                "title": title,
                "description": _truncate(description or title),
                "source": feed_name,
                "url": link,
                "image": image,
                "publishedAt": published_at,
                "category": category,
                "categoryLabel": _source_category_label(category),
            }
        )

    return parsed_items


async def _fetch_feed(client: httpx.AsyncClient, feed: dict[str, str]) -> list[dict[str, Any]]:
    response = await client.get(
        feed["url"],
        headers={
            "User-Agent": "MoneyKai/1.0 (+https://moneykai.app/news)",
            "Accept": "application/rss+xml, application/xml, text/xml",
        },
    )
    response.raise_for_status()
    return _parse_feed_items(response.text, feed["name"], feed["category"])


def _filter_items(items: list[dict[str, Any]], category: str) -> list[dict[str, Any]]:
    if category == "all":
        return items
    return [item for item in items if item["category"] == category]


def _sort_and_dedupe(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    deduped: dict[str, dict[str, Any]] = {}
    for item in items:
        existing = deduped.get(item["url"])
        if existing is None or item["publishedAt"] > existing["publishedAt"]:
            deduped[item["url"]] = item
    return sorted(deduped.values(), key=lambda item: item["publishedAt"], reverse=True)


async def get_live_news(category: str = "all", limit: int = DEFAULT_NEWS_LIMIT, refresh: bool = False) -> dict[str, Any]:
    if category not in {"all", "finance", "fintech"}:
        raise NewsServiceError("Unknown news category.")

    safe_limit = max(1, min(limit, MAX_NEWS_LIMIT))
    now = time.time()
    cached_items = NEWS_CACHE["items"]
    cache_age = now - float(NEWS_CACHE["fetched_at"] or 0.0)

    if not refresh and cached_items and cache_age < NEWS_CACHE_TTL_SECONDS:
        filtered = _filter_items(cached_items, category)[:safe_limit]
        return {
            "items": filtered,
            "category": category,
            "updatedAt": now_iso(),
            "cached": True,
            "stale": False,
            "sourceCount": len(NEWS_FEEDS),
        }

    async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
        results = await asyncio.gather(*(_fetch_feed(client, feed) for feed in NEWS_FEEDS), return_exceptions=True)

    items: list[dict[str, Any]] = []
    failures = 0
    for result in results:
        if isinstance(result, Exception):
            failures += 1
            continue
        items.extend(result)

    if items:
        merged = _sort_and_dedupe(items)
        NEWS_CACHE["items"] = merged
        NEWS_CACHE["fetched_at"] = now
        filtered = _filter_items(merged, category)[:safe_limit]
        return {
            "items": filtered,
            "category": category,
            "updatedAt": now_iso(),
            "cached": False,
            "stale": False,
            "sourceCount": len(NEWS_FEEDS) - failures,
        }

    if cached_items:
        filtered = _filter_items(cached_items, category)[:safe_limit]
        return {
            "items": filtered,
            "category": category,
            "updatedAt": now_iso(),
            "cached": True,
            "stale": True,
            "sourceCount": len(NEWS_FEEDS) - failures,
        }

    raise NewsServiceError("Unable to load live finance and fintech news right now.")
