
from anyio import Path

from .db import Database

from .pipeline import run

from flask import Flask, request, jsonify
from dataclasses import dataclass, field
from typing import List, Optional
import os
import openai
import threading
import json
from flask_cors import CORS


from dotenv import load_dotenv

from src.analyzers.site_crawler import clean_ai_json

load_dotenv()

from .config import CONTINENTAL_US_STATES, SERVICE_QUERIES, THESIS_NAME, THESIS
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
openai.api_key = OPENAI_API_KEY
DB_PATH_DEFAULT = Path("data/exit_group.db")


# -----------------------------------
# Flask Setup
# -----------------------------------

app = Flask(__name__)
CORS(app)


# -----------------------------------
# AI Analyzer
# -----------------------------------

def analyze_with_ai(user_text: str) -> dict:
    """
    Uses OpenAI to extract states and services from free text.
    Returns:
    {
        "thesisName": str,
        "revenue": str,
        "employeeCount": str,
        "ownershipType": str,
        "exclusionReason": [str],
        "states": [str],
        "services": [str]
    }
    """

    prompt = f"""
You are an assistant that extracts structured information from M&A target thesis descriptions.

Instructions:
1. Read the input text carefully.
2. Extract the following fields:
   - thesisName: Short descriptive name of the investment thesis.
   - revenue: Revenue threshold, if mentioned (e.g., "greater than $3M").
   - employeeCount: Minimum employee count, if mentioned.
   - ownershipType: Ownership type (e.g., "privately held").
   - exclusionReason: List of exclusion criteria.
   - states: US state abbreviations (2-letter codes) where targets should be located.
   - services: List of relevant service types offered by target companies.

3. Return the result as **strict JSON only**. Do not include explanations or extra text.

Example format:

{{
    "thesisName": "Specialty Tax Advisory",
    "revenue": ">$3M",
    "employeeCount": ">5",
    "ownershipType": "Privately held",
    "exclusionReason": [
        "Primary service is ERC work",
        "Focused exclusively on Property Tax consulting"
    ],
    "states": ["AL","AZ","AR","CA",...],
    "services": [
        "R&D Tax Credits",
        "Cost Segregation",
        "Work Opportunity Tax Credits (WOTC)",
        "Sales & Use Tax consulting"
    ]
}}

Text to analyze:
{user_text}
"""

    try:
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4.1",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        text = response.choices[0].message.content
        result = clean_ai_json(text)
        
    except Exception as e:
        print(f"[ai_analyze_company] failed: {e}")
        result = {}
    return result

    # Safe JSON parsing



# -----------------------------------
# API Endpoint
# -----------------------------------
@app.route('/')
def home():
    return 'Home Page Route'

@app.route("/generate-config", methods=["POST"])
def generate_config():
    data = request.json
    description = data.get("description", "")
    userEmail = data.get("email", "")   
    print(description)
    THESIS = description

    # Run AI only if description provided
    if description:
        try:
            ai_output = analyze_with_ai(description)

            if ai_output.get("states"):
                CONTINENTAL_US_STATES = ai_output["states"]

            if ai_output.get("services"):
                SERVICE_QUERIES = ai_output["services"]

            if ai_output.get("thesisName"):
                THESIS_NAME = ai_output["thesisName"]
        
            #  Run pipeline in background
            thread = threading.Thread(
                target=run,
                kwargs={
                    "states": CONTINENTAL_US_STATES,
                    "max_per_query": 20,
                    "thesis_name": THESIS_NAME,
                    "user_email": userEmail,
                    "service_queries": SERVICE_QUERIES,
                    "thesis": THESIS
                }
            )
            thread.start()

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return jsonify({
        "continental_states": CONTINENTAL_US_STATES,
        "service_queries": SERVICE_QUERIES,
        "thesis_name": THESIS_NAME
    })

@app.route("/thesis-names", methods=["GET"])
def get_all_thesis_names():
    db = Database(DB_PATH_DEFAULT)

    rows = db.query("""
        SELECT thesis_name
        FROM thesis
        WHERE thesis_name IS NOT NULL
    """)

    thesis_names = [r["thesis_name"] for r in rows]

    return jsonify({
        "thesis_names": thesis_names
    })

# Mapping for human-readable service names
SERVICE_NAME_MAP = {
    "cost_segregation_firm": "Cost Segregation",
    "r_d_tax_credit_consulting": "R&D Tax Credit",
    "work_opportunity_tax_credit": "Work Opportunity Tax Credit",
    "sales_and_use_tax_consulting": "Sales & Use Tax"
}

@app.route("/companies-by-thesis", methods=["POST"])
def get_companies_by_thesis():
    data = request.json
    thesis_name = data.get("thesis_name")

    if not thesis_name:
        return jsonify({"error": "thesis_name is required"}), 400

    db = Database(DB_PATH_DEFAULT)

    # Copy to /tmp because serverless can write there
    

    # Fetch companies matching the thesis
    rows = db.conn.execute("""
        SELECT *
        FROM companies
        WHERE thesis_name = ?
          AND is_excluded = 0
          AND (ownership_type IS NULL OR lower(ownership_type) NOT LIKE '%public%')
    """, (thesis_name,)).fetchall()

    companies = []
    for r in rows:
        company = dict(r)

        # Process services_json if exists
        services_str = company.get("services_json")
        readable_services = ""
        if services_str:
            try:
                services_json = json.loads(services_str)
                services_dict = services_json.get("services", {})

                # Keep only services with True value
                true_services = [
                    SERVICE_NAME_MAP.get(k, k.replace("_", " ").title())
                    for k, v in services_dict.items() if v
                ]
                readable_services = ", ".join(true_services)
            except json.JSONDecodeError:
                readable_services = ""

        company["services_readable"] = readable_services
        companies.append(company)

    return jsonify({
        "companies": companies
    })



# -----------------------------------
# Run App
# -----------------------------------

if __name__ == "__main__":
    app.run(debug=True)