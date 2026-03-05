from __future__ import annotations

import json
import re
from typing import Any, Dict, Optional
import tldextract

LEGAL_SUFFIXES = [
    "llc", "inc", "corp", "corporation", "co", "company", "ltd", "pllc", "llp", "pc"
]

def normalize_company_name(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[\.,'\"\(\)\[\]\/\-]+", " ", s)
    tokens = [t for t in s.split() if t and t not in LEGAL_SUFFIXES]
    return " ".join(tokens)

def extract_domain(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    try:
        ext = tldextract.extract(url)
        if not ext.domain:
            return None
        return f"{ext.domain}.{ext.suffix}" if ext.suffix else ext.domain
    except Exception:
        return None

def safe_json_dumps(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, sort_keys=True)

def safe_json_loads(s: Optional[str]) -> Dict[str, Any]:
    if not s:
        return {}
    try:
        return json.loads(s)
    except Exception:
        return {}
