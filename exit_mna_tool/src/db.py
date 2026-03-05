from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Tuple

DB_PATH_DEFAULT = Path("data/exit_group.db")

SCHEMA_SQL = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    website TEXT,
    phone TEXT,

    -- Core classification
    services_json TEXT,             -- JSON dict of service booleans + signals
    ownership_type TEXT,

    -- Size / economics
    employee_count INTEGER,         -- single best estimate (may be derived from min/max)
    employee_min INTEGER,
    employee_max INTEGER,
    employee_method TEXT,           -- e.g. 'clutch', 'upcity', 'google_reviews_proxy', 'manual', 'unknown'

    estimated_revenue REAL,         -- single best estimate (midpoint of min/max when available)
    revenue_min REAL,
    revenue_max REAL,
    revenue_method TEXT,            -- e.g. 'website_claim', 'directory_claim', 'heuristic_from_employees'

    -- Contacts / provenance
    key_contact TEXT,
    data_source TEXT,               -- pipeline seed sources; may be merged e.g. 'google_maps;web_search'
    source_url TEXT,                -- seed listing URL / reference
    raw_snippet TEXT,               -- freeform JSON/text
    validated_sources_count INTEGER DEFAULT 0,

    -- Screening flags
    is_excluded INTEGER DEFAULT 0,
    exclusion_reason TEXT,
    thesis_name TEXT,
    quality_score REAL DEFAULT 0,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_name_state_website
ON companies (name, state, website);
"""


def _coerce_sqlite_value(v: Any) -> Any:
    """SQLite only supports primitive bind types; convert objects to JSON strings."""
    if v is None:
        return None
    if isinstance(v, bool):
        return int(v)
    if isinstance(v, (str, int, float, bytes)):
        return v
    try:
        return json.dumps(v, ensure_ascii=False)
    except TypeError:
        return str(v)


class Database:
    def __init__(self, db_path: Path = DB_PATH_DEFAULT):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.db_path))
        self.conn.row_factory = sqlite3.Row

    def init(self) -> None:
        self.conn.executescript(SCHEMA_SQL)
        self.conn.commit()

    def upsert_company(self, row: Dict[str, Any]) -> int:
        fields = [
            "name","city","state","website","phone",
            "services_json","ownership_type",
            "employee_count","employee_min","employee_max","employee_method",
            "estimated_revenue","revenue_min","revenue_max","revenue_method",
            "key_contact","data_source","source_url","raw_snippet","validated_sources_count",
            "is_excluded","exclusion_reason","thesis_name","quality_score",
        ]
        data = {k: row.get(k) for k in fields}

        placeholders = ",".join(["?"] * len(fields))
        columns = ",".join(fields)
        values = [_coerce_sqlite_value(data[k]) for k in fields]

        try:
            cur = self.conn.execute(
                f"INSERT INTO companies ({columns}) VALUES ({placeholders})",
                values
            )
            self.conn.commit()
            return int(cur.lastrowid)
        except sqlite3.IntegrityError:
            cur = self.conn.execute(
                "SELECT id FROM companies WHERE name=? AND state=? AND (website IS ? OR website = ?)",
                (_coerce_sqlite_value(data["name"]), _coerce_sqlite_value(data["state"]),
                 _coerce_sqlite_value(data["website"]), _coerce_sqlite_value(data["website"]))
            )
            existing = cur.fetchone()
            if not existing:
                cur = self.conn.execute(
                    "SELECT id FROM companies WHERE name=? AND state=?",
                    (_coerce_sqlite_value(data["name"]), _coerce_sqlite_value(data["state"]))
                )
                existing = cur.fetchone()
            if not existing:
                raise

            company_id = int(existing["id"])
            set_clause = ",".join([f"{k}=?" for k in fields if k != "name"])
            upd_values = [_coerce_sqlite_value(data[k]) for k in fields if k != "name"] + [company_id]
            self.conn.execute(
                f"UPDATE companies SET {set_clause}, updated_at=datetime('now') WHERE id=?",
                upd_values
            )
            self.conn.commit()
            return company_id

    def insert_company_source(self, company_id: int, src: Dict[str, Any]) -> None:
        fields = [
            "company_id","source_name","listing_url","extracted_website",
            "employee_range_text","employee_min","employee_max",
            "revenue_range_text","revenue_min","revenue_max",
            "services_json","raw_snippet",
        ]
        data = {k: src.get(k) for k in fields}
        data["company_id"] = company_id

        placeholders = ",".join(["?"] * len(fields))
        columns = ",".join(fields)
        values = [_coerce_sqlite_value(data[k]) for k in fields]
        self.conn.execute(
            f"INSERT INTO company_sources ({columns}) VALUES ({placeholders})",
            values
        )
        self.conn.commit()

    def fetch_companies(self, where: str = "1=1", params: Tuple[Any, ...] = ()) -> List[sqlite3.Row]:
        cur = self.conn.execute(f"SELECT * FROM companies WHERE {where}", params)
        return list(cur.fetchall())

    def update_company(self, company_id: int, updates: Dict[str, Any]) -> None:
        if not updates:
            return
        keys = list(updates.keys())
        set_clause = ",".join([f"{k}=?" for k in keys])
        values = [_coerce_sqlite_value(updates[k]) for k in keys] + [company_id]
        self.conn.execute(f"UPDATE companies SET {set_clause}, updated_at=datetime('now') WHERE id=?", values)
        self.conn.commit()

    def delete_company(self, company_id: int) -> None:
        self.conn.execute("DELETE FROM companies WHERE id=?", (company_id,))
        self.conn.commit()

    def query(self, sql, params=()):
        cur = self.conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()
        return rows


    def close(self) -> None:
        self.conn.close()
