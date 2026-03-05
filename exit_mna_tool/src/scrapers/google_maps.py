from __future__ import annotations

import os
from typing import Dict, Iterable, Iterator, List, Optional, Set
import requests

from ..logging_utils import get_logger
from ..config import  USER_AGENT, SERVICE_QUERIES, THESIS_NAME
import re
from typing import Optional, Tuple
from dotenv import load_dotenv

load_dotenv()

logger = get_logger(__name__)

PLACES_TEXTSEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
PLACES_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"


_US_STATE_RE = re.compile(r"\b([A-Z]{2})\b")

def parse_city_state_us(formatted_address: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Best-effort parser for addresses like:
      "123 Main St, Austin, TX 78701, USA"
      "Austin, TX 78701, USA"
      "Austin, TX, USA"

    Returns: (city, state_abbrev)
    """
    if not formatted_address:
        return None, None

    parts = [p.strip() for p in formatted_address.split(",") if p.strip()]
    if len(parts) < 2:
        return None, None

    # Find the segment that contains the state abbrev (usually "TX 78701" or "TX")
    state = None
    state_segment_idx = None
    for i, seg in enumerate(parts):
        m = _US_STATE_RE.search(seg)
        if m:
            state = m.group(1)
            state_segment_idx = i
            break

    if not state:
        return None, None

    # City is usually the segment immediately before the state segment
    city = None
    if state_segment_idx is not None and state_segment_idx - 1 >= 0:
        city = parts[state_segment_idx - 1]

    return city, state

def _api_key() -> str:
    key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
    if not key:
        raise RuntimeError("GOOGLE_MAPS_API_KEY is not set.")
    return key

def text_search(query: str, region: str = "U.S.", max_pages: int = 1, sleep_s: float = 2.0) -> List[Dict]:
    """Run Places Text Search. Returns raw Places results."""
    import time
    key = _api_key()
    results: List[Dict] = []
    page_token: Optional[str] = None
    headers = {"User-Agent": USER_AGENT}

    for _ in range(max_pages):
        params = {"query": query, "region": region, "key": key}
        if page_token:
            params["pagetoken"] = page_token
        resp = requests.get(PLACES_TEXTSEARCH_URL, params=params, headers=headers, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        results.extend(data.get("results", []))
        page_token = data.get("next_page_token")
        if not page_token:
            break
        # Google requires a short delay before next_page_token becomes valid
        time.sleep(sleep_s)

    return results

def place_details(place_id: str, fields: str = "name,website,formatted_phone_number,geometry,formatted_address") -> Dict:
    key = _api_key()
    headers = {"User-Agent": USER_AGENT}
    params = {"place_id": place_id, "fields": fields, "key": key}
    resp = requests.get(PLACES_DETAILS_URL, params=params, headers=headers, timeout=20)
    resp.raise_for_status()
    return resp.json().get("result", {})


def iter_company_seeds(service_queries: Iterable[str], states: Iterable[str], thesis_name: str, max_per_query: int = 20) -> Iterator[Dict]:
    """
    Yield standardized seed rows from Google Maps.

    Two-phase logic:
    1. Collect basic seeds from text_search only.
    2. Optionally enrich with place_details for website/phone.

    Output fields:
    - name, city, state, website, phone, data_source, source_url, raw_snippet
    """

    for st in states:
        for q in service_queries:
            query = f"{q} in {st}"
            logger.info(f"[GoogleMaps] textsearch: {query}")
            try:
                raw_results = text_search(query, max_pages=1)
            except Exception as e:
                logger.warning(f"[GoogleMaps] text_search failed for query '{query}': {e}")
                continue

            for r in raw_results[:max_per_query]:
                place_id = r.get("place_id")

                # Phase 2: Optional enrichment
                details: Dict = {}
                if place_id:
                    try:
                        details = place_details(place_id)
                    except Exception as e:
                        logger.warning(f"[GoogleMaps] place_details failed for {place_id}: {e}")

                name = details.get("name") or r.get("name")
                website = details.get("website")
                phone = details.get("formatted_phone_number")
                address = details.get("formatted_address") or r.get("formatted_address") or ""

                parsed_city, parsed_state = parse_city_state_us(address)
                city = parsed_city or ""
                state_name = parsed_state or ""

                yield {
                    "name": name,
                    "city": city,
                    "state": state_name,
                    "website": website,
                    "phone": phone,
                    "data_source": "google_maps_places",
                    "source_url": "google_maps_places_api",
                    "raw_snippet": r.get("types"),
                    "query_state": st,
                    "thesis_name": thesis_name,
                }