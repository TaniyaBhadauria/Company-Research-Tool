from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from readability import Document

from ..config import MAX_SITE_PAGES, SITE_CRAWL_TIMEOUT_S, USER_AGENT
from ..logging_utils import get_logger
import json
import os
import openai
from dotenv import load_dotenv

load_dotenv()

logger = get_logger(__name__)

@dataclass
class Page:
    url: str
    status_code: Optional[int]
    content_type: Optional[str]
    text: str

def _clean_text(html: str) -> str: 
    soup = BeautifulSoup(html, "html.parser") 
    for tag in soup(["script", "style", "noscript"]): 
        tag.decompose() 
        return soup.get_text(" ", strip=True)    

def _candidate_links(base_url: str, html: str) -> List[str]:
    """
    Collect all candidate links from a page (same domain, first-level paths only).
    Returns list of URLs to be ranked by AI.
    """
    soup = BeautifulSoup(html, "html.parser")
    links: List[str] = []
    for a in soup.select("a[href]"):
        href = a.get("href", "").strip()
        if not href:
            continue
        full = urljoin(base_url, href)
        # keep same domain only
        if urlparse(full).netloc != urlparse(base_url).netloc:
            continue
        parsed = urlparse(full)
        
        links.append(full)
    
    # de-dup while preserving order
    seen = set()
    out = []
    for l in links:
        if l not in seen:
            seen.add(l)
            out.append(l)

    return out

def _rank_urls_with_ai(urls: List[str], homepage_text: str, services: List[str]) -> List[str]:
    """
    Use AI to rank and select top 6 most relevant URLs for tax advisory content.
    Returns up to 6 URLs ranked by relevance.
    """
    if not urls:
        return []
    
    urls_str = "\n".join(f"{i+1}. {url}" for i, url in enumerate(urls))
    
    # Define the tool schema
    tool_schema = {
        "type": "function",
        "function": {
            "name": "select_urls",
            "description": "Select the most relevant URLs from a tax advisory firm's website for due-diligence analysis.",
            "parameters": {
                "type": "object",
                "properties": {
                    "urls": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of selected URLs (up to 4) that are most likely to contain relevant information",
                        "maxItems": 4
                    }
                },
                "required": ["urls"]
            }
        }
    }
    
    prompt = f"""
You are selecting URLs from a tax advisory firm's website for due-diligence analysis.

Select up to 4 URLs that are MOST LIKELY to contain one or more of the following:
• Evidence that the firm provides {', '.join(services)} services
• Company-level information such as:
  – Estimated revenue (if publicly stated)
  – Employee count or firm size
  – Ownership type (private, PE-backed, franchise, etc.)
  – Key contact, founder, or owner name

IMPORTANT SELECTION RULES:
• Prefer service overview pages, core service detail pages, and firm profile pages
• Prefer URLs whose path indicates services, offerings, capabilities, or company overview
• Exclude blogs, news, articles, whitepapers, case studies, FAQs, calculators, careers, scholarships, community, privacy, and policy pages
• Do NOT invent or modify URLs — only choose from the list

Candidate URLs:
{urls_str}
"""    
    try:
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            tools=[tool_schema],
            tool_choice={"type": "function", "function": {"name": "select_urls"}}
        )
        
        # Parse the tool call
        tool_call = response.choices[0].message.tool_calls[0]
        result = json.loads(tool_call.function.arguments)
        ranked_urls = result.get("urls", [])

        return [u for u in ranked_urls if isinstance(u, str) and u.startswith(("http://", "https://"))]
    
    except Exception as e:
        logger.debug(f"[_rank_urls_with_ai] failed: {e}")
        # Fallback: return original list
        return urls[:6]

def crawl_site(start_url: str,services: List[str], max_pages: int = MAX_SITE_PAGES) -> List[Page]:
    headers = {"User-Agent": USER_AGENT}
    pages: List[Page] = []
    visited: Set[str] = set()
    
    queue: List[str] = [start_url]
    while queue and len(pages) < max_pages:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)

        try:
            resp = requests.get(url, headers=headers, timeout=SITE_CRAWL_TIMEOUT_S, allow_redirects=True)
            status = resp.status_code
            ctype = resp.headers.get("content-type")
            if "text/html" not in (ctype or ""):
                pages.append(Page(url=url, status_code=status, content_type=ctype, text=""))
                continue

            text = _clean_text(resp.text)
            pages.append(Page(url=url, status_code=status, content_type=ctype, text=text))

            # rank and add relevant internal links from the homepage only
            if len(pages) == 1:
                all_candidate_urls = _candidate_links(resp.url, resp.text)
                ranked_urls = _rank_urls_with_ai(all_candidate_urls, text, services)
                queue.extend(ranked_urls[:max_pages])


        except Exception as e:
            logger.debug(f"[crawl] failed {url}: {e}")
            pages.append(Page(url=url, status_code=None, content_type=None, text=""))

    return pages




def clean_ai_json(raw_text: str) -> dict:
    default = {
        "services": {
            "r_and_d_tax_credits": False,
            "cost_segregation": False,
            "wotc": False,
            "sales_and_use_tax": False
        },
        "exclusion_reason": None,
        "ownership_type": None,
        "key_contact": {"name": None, "title": None},
        "revenue": {"min": None, "max": None},
        "confidence": 0.0
    }

    # Remove any ```json or ``` markers
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[len("```json"):].strip()
    if text.startswith("```"):
        text = text[3:].strip()
    if text.endswith("```"):
        text = text[:-3].strip()

    try:
        return json.loads(text)
    except Exception as e:
        print(f"[clean_ai_json] failed: {e}")
        return default

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
openai.api_key = OPENAI_API_KEY

def _chunk_text(text: str, chunk_size: int = 30000, overlap: int = 200) -> List[str]:
    """
    Split text into chunks with optional overlap to preserve context.
    
    Args:
        text: The text to chunk
        chunk_size: Maximum characters per chunk
        overlap: Number of characters to overlap between chunks
    
    Returns:
        List of text chunks
    """
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end]
        chunks.append(chunk)
        
        # Move start position for next chunk, accounting for overlap
        start = end - overlap if end < len(text) else len(text)
    
    return chunks

def _merge_analysis_results(results: List[dict], services: List[str]) -> dict:
    """
    Merge multiple analysis results from chunks into a single result.
    
    Merging strategy:
    - services: Use OR logic (if any chunk found it, consider it true)
    - exclusion_reason: If any chunk has an exclusion reason, prioritize it
    - ownership_type: Use first non-null value found
    - key_contact: Combine and prefer non-null values
    - revenue: Aggregate min/max across chunks
    - employee_count: Aggregate min/max across chunks
    - confidence: Average confidence across chunks
    """
    import re
    
    if not results:
        return {}
    
    def normalize_service_key(service):
        return re.sub(r'[^a-z0-9]+', '_', service.lower()).strip('_')
    
    merged = {
        "services": {},
        "exclusion_reason": None,
        "ownership_type": None,
        "key_contact": {"name": None, "title": None},
        "revenue": {"min": None, "max": None},
        "employee_count": {"min": None, "max": None},
        "confidence": 0.0
    }
    
    # Initialize services with all false
    for service in services:
        key = normalize_service_key(service)
        merged["services"][key] = False
    
    # Merge results
    valid_results = [r for r in results if r and isinstance(r, dict)]
    
    if not valid_results:
        merged["confidence"] = 0.0
        return merged
    
    # Services: OR logic
    for result in valid_results:
        if "services" in result and isinstance(result["services"], dict):
            for key, value in result["services"].items():
                if value:
                    merged["services"][key] = True
    
    # Exclusion reason: prioritize first non-null
    for result in valid_results:
        if result.get("exclusion_reason"):
            merged["exclusion_reason"] = result["exclusion_reason"]
            break
    
    # Ownership type: use first non-null found
    for result in valid_results:
        if result.get("ownership_type"):
            merged["ownership_type"] = result["ownership_type"]
            break
    
    # Key contact: prefer non-null values
    for result in valid_results:
        if result.get("key_contact"):
            contact = result["key_contact"]
            if contact.get("name") and not merged["key_contact"]["name"]:
                merged["key_contact"]["name"] = contact["name"]
            if contact.get("title") and not merged["key_contact"]["title"]:
                merged["key_contact"]["title"] = contact["title"]
    
    # Revenue: aggregate min/max
    revenue_mins = []
    revenue_maxs = []
    for result in valid_results:
        if result.get("revenue"):
            if result["revenue"].get("min"):
                revenue_mins.append(result["revenue"]["min"])
            if result["revenue"].get("max"):
                revenue_maxs.append(result["revenue"]["max"])
    
    if revenue_mins:
        merged["revenue"]["min"] = min(revenue_mins)
    if revenue_maxs:
        merged["revenue"]["max"] = max(revenue_maxs)
    
    # Employee count: aggregate min/max
    emp_mins = []
    emp_maxs = []
    for result in valid_results:
        if result.get("employee_count"):
            if result["employee_count"].get("min"):
                emp_mins.append(result["employee_count"]["min"])
            if result["employee_count"].get("max"):
                emp_maxs.append(result["employee_count"]["max"])
    
    if emp_mins:
        merged["employee_count"]["min"] = min(emp_mins)
    if emp_maxs:
        merged["employee_count"]["max"] = max(emp_maxs)
    
    # Confidence: average across chunks
    confidences = [r.get("confidence", 0.0) for r in valid_results if isinstance(r.get("confidence"), (int, float))]
    if confidences:
        merged["confidence"] = sum(confidences) / len(confidences)
    
    return merged

def ai_analyze_company(all_text: str, thesis: str, services: List[str]) -> dict:
    """
    Send website text to GPT-4 for full structured extraction using tool calling.
    
    Automatically chunks large text to handle context window limits.

    Returns a dict with:
    - services: dict of booleans
    - exclusion_reason: str or None
    - ownership_type: str or None
    - key_contact: dict with 'name' and 'title'
    - revenue: dict with 'min' and 'max'
    - employee_count: dict with 'min' and 'max'
    - confidence: float
    """
    import re

    def normalize_service_key(service):
        return re.sub(r'[^a-z0-9]+', '_', service.lower()).strip('_')

    # Define the tool schema with dynamic services
    services_properties = {}
    for service in services:
        key = normalize_service_key(service)
        services_properties[key] = {"type": "boolean", "description": f"Whether the company provides {service}"}
    
    tool_schema = {
        "type": "function",
        "function": {
            "name": "analyze_company",
            "description": "Analyze a tax advisory company's website content and extract structured information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "services": {
                        "type": "object",
                        "description": "Dictionary of services offered by the company",
                        "properties": services_properties,
                        "required": list(services_properties.keys())
                    },
                    "exclusion_reason": {
                        "type": ["string", "null"],
                        "description": "Reason why this company should be excluded, or null"
                    },
                    "ownership_type": {
                        "type": ["string", "null"],
                        "description": "Type of ownership (e.g., private, PE-backed, franchise)"
                    },
                    "key_contact": {
                        "type": "object",
                        "description": "Contact person at the company",
                        "properties": {
                            "name": {"type": ["string", "null"]},
                            "title": {"type": ["string", "null"]}
                        },
                        "required": ["name", "title"]
                    },
                    "employee_count": {
                        "type": "object",
                        "description": "Estimated number of employees at the company",
                        "properties": {
                            "min": {"type": ["number", "null"], "description": "Minimum estimated employee count"},
                            "max": {"type": ["number", "null"], "description": "Maximum estimated employee count"}
                        },
                        "required": ["min", "max"],
                    },
                    "revenue": {
                        "type": "object",
                        "description": "Estimated revenue range of the company (in USD)",
                        "properties": {
                            "min": {"type": ["number", "null"],"description": "Minimum estimated annual revenue"},
                            "max": {"type": ["number", "null"],"description": "Maximum estimated annual revenue"}
                        },
                        "required": ["min", "max"]
                    },
                    "confidence": {
                        "type": "number",
                        "description": "Confidence score from 0.0 to 1.0"
                    }
                },
                "required": ["services", "exclusion_reason", "ownership_type", "key_contact", "revenue", "confidence", "employee_count"]
            }
        }
    }

    # Chunk the text to handle large inputs
    chunks = _chunk_text(all_text, chunk_size=30000, overlap=200)
    
    all_results = []
    
    for chunk_idx, chunk in enumerate(chunks, 1):
        prompt = f"""
You are an M&A research analyst tasked with identifying specialty tax advisory firms in the Continental United States 
that match the following acquisition thesis:

**Target Thesis: {thesis}**  

**Your task:** Analyze the website content of a candidate company (provided below) and extract structured information based on the above thesis.
Exclude companies that do not meet the employee threshold and revenue threshold mentioned in thesis and mention it in the exclusion reason.
Only use information available on the company website.

Website content (Chunk {chunk_idx}/{len(chunks)}):
\"\"\"
{chunk}
\"\"\"
"""
        
        try:
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-4-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                tools=[tool_schema],
                tool_choice={"type": "function", "function": {"name": "analyze_company"}}
            )

            # Parse the tool call
            tool_call = response.choices[0].message.tool_calls[0]
            result = json.loads(tool_call.function.arguments)
            all_results.append(result)
            
        except Exception as e:
            print(f"[ai_analyze_company] chunk {chunk_idx} failed: {e}")
            all_results.append({})
    
    # Merge results from all chunks
    merged_result = _merge_analysis_results(all_results, services)
    
    return merged_result