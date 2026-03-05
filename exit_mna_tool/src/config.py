from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

# -------------------------
# Thesis / screening config
# -------------------------

CONTINENTAL_US_STATES = [
    "AL", "AZ","AR","CA","CO","CT","DE","FL","GA","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI",
    "MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
    "TX","UT","VT","VA","WA","WV","WI","WY"
]
THESIS_NAME = "Specialty Tax Advisory Services"
THESIS = f"""Specialty Tax Advisory Services**  
- Focus: Privately held specialty tax firms providing one or more of these services:
  1. R&D Tax Credits
  2. Cost Segregation
  3. Work Opportunity Tax Credits (WOTC)
  4. Sales & Use Tax consulting
- Size: Estimated revenue > $3M or employee count > 5
- Geography: Continental US
- Ownership: Privately held; not affiliated with a union workforce
- Exclusions: Do NOT include firms whose primary service is Employee Retention Credit (ERC) or exclusively Property Tax consulting.
"""

SERVICE_QUERIES = [
    "R&D tax credit consulting",
    "cost segregation firm",
    "work opportunity tax credit",
    "sales and use tax consulting",
]


# Keywords used to classify services on a firm's website
SERVICE_KEYWORDS: Dict[str, List[str]] = {
    "rd_tax_credits": [
        "r&d tax credit",
        "research and development tax credit",
        "research & development credit",
        "section 41",
        "form 6765",
        "rd credit",
        "innovation tax credit",
        "federal r&d credit",
        "state r&d credit",
        "research credit study",
    ],
    "cost_segregation": [
        "cost segregation",
        "cost seg study",
        "segregation study",
        "engineering-based study",
        "engineering study",
        "accelerated depreciation",
        "irs cost segregation",
        "property reclassification",
        "fixed asset reclassification",
    ],
    "wotc": [
        "work opportunity tax credit",
        "wotc",
        "wotc screening",
        "wotc program",
        "employment tax credit",
        "targeted employee credit",
        "hiring tax credit",
    ],
    "sales_use_tax": [
        "sales and use tax",
        "sales & use tax",
        "sales tax consulting",
        "use tax consulting",
        "sales tax compliance",
        "sales tax audit defense",
        "state and local tax",
        "salt services",
        "transaction tax",
        "indirect tax",
    ],
}

EXCLUSION_KEYWORDS = {
    "erc_primary": [
        "employee retention credit", "erc refund", "erc specialists", "erc filing",
    ],
    "property_tax_only": [
        "property tax appeal", "property tax consulting", "property tax reduction", "real estate tax appeal",
    ],
}

OWNERSHIP_KEYWORDS = {
    "pe_backed": [
        "portfolio company", "backed by", "private equity", "acquired by", "a leading investor",
    ],
    "public_company": [
        "nasdaq", "nyse", "investor relations", "10-k", "10q", "form 8-k",
    ],
}


@dataclass(frozen=True)
class Thresholds:
    min_employees: int = 6           # employee count > 5
    min_revenue_usd: float = 3_000_000.0

THRESHOLDS = Thresholds()

# Revenue-per-employee heuristic for professional services (used when only employee count is known)
REVENUE_PER_EMPLOYEE_USD = 200_000.0

# How many pages to fetch from a company website for classification
MAX_SITE_PAGES = 8
SITE_CRAWL_TIMEOUT_S = 10
USER_AGENT = "ExitGroupResearchBot/1.0 (contact: candidate@example.com)"
VALIDATION_MAX_RESULTS_PER_QUERY = 10
VALIDATION_SLEEP_S = 2.0