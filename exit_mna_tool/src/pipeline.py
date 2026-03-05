from __future__ import annotations

import os
import re
import sqlite3
import time
from typing import List, Optional, Dict, Any

import typer
from rich.progress import track
from rapidfuzz import fuzz
from bs4 import BeautifulSoup
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

# load environment variables early
load_dotenv()

from .config import CONTINENTAL_US_STATES, SERVICE_QUERIES, THESIS, THESIS_NAME
from .db import Database, DB_PATH_DEFAULT
from .logging_utils import get_logger
from .utils import safe_json_dumps, safe_json_loads, extract_domain, normalize_company_name

from .scrapers.google_maps import iter_company_seeds as maps_seeds

from .analyzers.site_crawler import crawl_site, ai_analyze_company


logger = get_logger(__name__)


def _best_effort_midpoint(lo: Optional[int], hi: Optional[int]) -> Optional[int]:
    if lo is None and hi is None:
        return None
    if lo is None:
        return hi
    if hi is None:
        return lo
    return int(round((lo + hi) / 2.0))


def create_and_get_thesis_id(db_path: str = str(DB_PATH_DEFAULT),
    thesis_name: str = THESIS_NAME,
    user_email: str | None = None) -> int:
    """
    Creates the thesis table if it doesn't exist,
    and returns the thesis_id for the given thesis_name and user_email.
    If the thesis already exists, returns the existing id.
    If not, inserts a new row and returns the new id.

    Args:
        db: Database instance with execute/commit methods
        thesis_name: Thesis name
        user_email: User email associated with the thesis, can be None

    Returns:
        int: ID of the thesis
    """

    # 1️⃣ Create table if it doesn't exist
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS thesis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        thesis_name TEXT NOT NULL,
        user_email TEXT, -- nullable
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(thesis_name, user_email) -- prevent duplicates
    );
    """

    db = Database(db_path)
    db.init()
    db.conn.execute(create_table_sql)

     # Check if thesis exists
    select_sql = """
    SELECT id FROM thesis
    WHERE thesis_name = ? AND (user_email = ? OR (user_email IS NULL AND ? IS NULL))
    """
    # For SQLite, replace "%s" with "?" placeholders
    result = db.conn.execute(select_sql, (thesis_name, user_email, user_email)).fetchone()
    if result:
        return result[0]  # existing thesis_id

    # 3️⃣ Insert new thesis
    insert_sql = "INSERT INTO thesis (thesis_name, user_email) VALUES (?, ?) RETURNING id;"
    result = db.conn.execute(insert_sql, (thesis_name, user_email))
    thesis_id = result.fetchone()[0]

    db.conn.commit()
    return thesis_id


def seeds(
    db_path: str = str(DB_PATH_DEFAULT),
    max_per_query: int = 20,
    states: list = CONTINENTAL_US_STATES,
    thesis_name: str = THESIS_NAME,
    service_queries: Optional[str] = SERVICE_QUERIES
):
    """PHASE 1: Collect raw company seeds (Google Maps primary + optional web search)."""
    db = Database(db_path)
    db.init()


    seen_keys = set()

    for row in track(maps_seeds(service_queries, states, thesis_name=thesis_name, max_per_query=max_per_query), description="Google Maps seeds"):
        if not row.get("name"):
            continue

        # Filter: skip rows that have neither a state nor a website
        if not row.get("state") or not row.get("website"):
            continue

        # If generator included the query state, drop rows whose parsed state
        # does not match the state we queried for.
        qst = row.get("query_state")
        rstate = row.get("state")
        if qst and rstate and rstate.upper() != qst.upper():
            continue

        # Simple dedupe: prefer domain when available, otherwise phone.
        try:
            norm_name = normalize_company_name(row.get("name", ""))
        except Exception:
            norm_name = (row.get("name") or "").lower().strip()

        domain = extract_domain(row.get("website")) if row.get("website") else None
        phone = (row.get("phone") or "")
        key = (norm_name, domain or phone)
        if key in seen_keys:
            continue
        seen_keys.add(key)

        db.upsert_company(row)

    logger.info("✅ PHASE 1 complete.")
    db.close()


def analyze(db_path: str = str(DB_PATH_DEFAULT), thesis: str = THESIS,service_queries: Optional[List[str]] = SERVICE_QUERIES):
    """PHASE 2: Crawl websites and classify services + exclusions + ownership + revenue claims (AI-powered)."""
    
    db = Database(db_path)
    db.init()

    companies = db.fetch_companies(where="(website IS NOT NULL AND website != '') AND state = 'OH'")
    print(f"Analyzing {len(companies)} companies with websites...")

    for c_row in track(companies, description="Website analyze"):
        c = dict(c_row)
        cid = int(c["id"])
        website = c["website"]

        try:
            # Crawl homepage + first-level URLs
            pages = crawl_site(website,service_queries)
            all_text = " ".join([p.text for p in pages if p.text])
            # --- AI Analysis ---
            ai_result = ai_analyze_company(all_text, thesis, service_queries)

            # Services
            services = ai_result.get("services", {})
            # Exclusion
            excl = ai_result.get("exclusion_reason")
            # Ownership
            ownership = ai_result.get("ownership_type")
            # Key contact
            key_contact_data = ai_result.get("key_contact", {})
            person_name = key_contact_data.get("name")
            person_title = key_contact_data.get("title")
            key_contact = f"{person_name} ({person_title})" if person_name and person_title else person_name
            # Revenue
            rev = ai_result.get("revenue", {})
            rev_min = rev.get("min")
            rev_max = rev.get("max")

            # Employee count
            emp = ai_result.get("employee_count", {})
            emp_min = emp.get("min")
            emp_max = emp.get("max")

            payload = {"services": services}

            updates: Dict[str, any] = {
                "services_json": safe_json_dumps(payload),
                "is_excluded": 1 if excl else 0,
                "exclusion_reason": excl,
                "ownership_type": ownership,
                "key_contact": key_contact,
                "revenue_min": rev_min,
                "revenue_max": rev_max,
                "estimated_revenue": _best_effort_midpoint(rev_min, rev_max) if (rev_min or rev_max) else None,
                "employee_min": emp_min,
                "employee_max": emp_max,
                "employee_count": _best_effort_midpoint(emp_min, emp_max) if (emp_min or emp_max) else None,
            }
           

            db.update_company(cid, updates)

        except Exception as e:
            logger.warning(f"[analyze] failed {website}: {e}")

    logger.info("✅ PHASE 2 complete.")
    db.close()


def send_completion_email(thesis_name=None, user_email=None, db_path=str(DB_PATH_DEFAULT)):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT thesis_name, user_email FROM thesis WHERE thesis_name = ?",
        (thesis_name,)
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        return

    thesis_name, user_email = row

    if not user_email:
        return

    msg = EmailMessage()
    msg["Subject"] = f"Your Thesis Pipeline is Complete ✅"
    msg["From"] = "taniya.bhadauria96@gmail.com"
    msg["To"] = user_email

    msg.set_content(f"""
Hi,

Your thesis pipeline for:

{thesis_name}

has completed successfully.

You can now log in and review the results.

Thanks,
M&A Thesis Tool
""")

    # read credentials from environment
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    if not smtp_user or not smtp_pass:
        logger.error("SMTP credentials not set in environment")
        return

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(smtp_user, smtp_pass)
        smtp.send_message(msg)

def run(
    db_path: str = str(DB_PATH_DEFAULT),
    thesis_name: str = THESIS_NAME,
    service_queries: Optional[List[str]] = SERVICE_QUERIES,
    states: Optional[List[str]] = CONTINENTAL_US_STATES,
    user_email: str | None = None,
    max_per_query: int = 20,
    thesis: str = THESIS
):
    """Run end-to-end pipeline."""
    create_and_get_thesis_id(db_path=db_path, thesis_name=thesis_name, user_email=user_email)
    seeds(db_path=db_path, states=states, thesis_name=thesis_name, service_queries=service_queries, max_per_query=max_per_query)
    analyze(db_path=db_path,thesis=thesis,service_queries=service_queries)
    if user_email:
        send_completion_email(thesis_name=thesis_name, user_email=user_email, db_path=db_path)

if __name__ == "__main__":
    run()
