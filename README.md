# M&A Thesis Research Tool - Acquisition Target Screening Dashboard

A platform for screening and analyzing companies that align with theses.

---

## Overview

It is a web-based dashboard that aggregates public company data to help advisors and acquisition teams identify targets. It provides a filterable pipeline of companies alongside KPI summaries, geographic distribution maps, and ownership intelligence - all in a clean, modern interface.

The system has two components:

| Component | Path | Description |
|---|---|---|
| **Backend** | `exit_mna_tool/` | Python/Flask API + data pipeline |
| **Frontend** | `dashboard/` | React/TypeScript dashboard |

---

## Features

- **📊 KPI Summary Cards** - Total companies, states covered, revenue data coverage, and ownership identification rate.
- **🗂 Company Pipeline Table** - Sortable & filterable by service type, with search and export-to-Excel.
- **🗺 US Map Visualization** - State-level markers showing company concentration via Google Maps API.
- **📈 Charts** - Service type distribution (pie) and geographic distribution (bar).
- **🏷 Ownership Flagging** - Highlights Private Equity-backed companies with a distinct badge.
- **👤 Key Contact Display** - Shows identified contacts per company.
- **🔐 Authentication** — Role-based access control with Admin and Viewer roles.
- **🤖 AI-Powered Analysis** — Uses AI to extract services, ownership type, key contacts, and revenue from company websites.
- **📧 Email Notifications** — Sends completion email when a pipeline finishes running.

---

## Architecture

```
Company-Research-Tool/
├── exit_mna_tool/          # Python backend
│   ├── src/
│   │   ├── application.py  # Flask API entry point
│   │   ├── pipeline.py     # End-to-end data pipeline (seeds → analyze)
│   │   ├── config.py       # Thesis config, service keywords, thresholds
│   │   ├── db.py           # SQLite database layer
│   │   ├── utils.py        # Utility functions
│   │   ├── logging_utils.py
│   │   ├── scrapers/
│   │   │   └── google_maps.py      # Google Maps Places scraper
│   │   └── analyzers/
│   │       └── site_crawler.py     # Website crawler + GPT-4 analyzer
│   ├── data/
│   │   └── exit_group.db   # SQLite database (auto-created)
│   ├── requirements.txt
│   └── vercel.json         # Vercel deployment config
│
└── dashboard/              # React frontend
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   └── ProtectedRoute.tsx
    │   │   └── dashboard/
    │   │       ├── Charts.tsx
    │   │       ├── CompanyDetail.tsx
    │   │       ├── CompanyTable.tsx
    │   │       ├── DashboardLayout.tsx
    │   │       ├── KPICards.tsx
    │   │       ├── PipelineForm.tsx
    │   │       └── USMap.tsx
    │   ├── contexts/
    │   │   └── AuthContext.tsx      # Login, logout, RBAC
    │   ├── pages/
    │   │   ├── Index.tsx            # Main dashboard
    │   │   └── Login.tsx            # Auth page
    │   └── types/
    │       └── dashboard.ts         # Shared TypeScript interfaces
    ├── .env                         # API keys (not committed)
    └── package.json
```

---

## Data Pipeline

The backend runs a 2-phase pipeline to collect and analyze company data:

### Phase 1 — Seed Collection
- Queries **Google Maps Places API** with service-type search terms (e.g., "R&D tax credit consulting") across all US states.
- Deduplicates results by company name + domain.
- Stores raw company records in SQLite.

### Phase 2 — AI Analysis
- Crawls each company's website (up to 8 pages).
- Sends extracted text to **GPT-4** to identify:
  - Services offered (R&D Tax Credit, Cost Segregation, WOTC, Sales & Use Tax)
  - Ownership type (Private, PE-backed, Public)
  - Key contact name and title
  - Revenue and employee count estimates
- Flags companies for exclusion (e.g. ERC-only, property tax-only firms).
- Writes enriched data back to SQLite.

### Pipeline Flow

```
POST /generate-config
       │
       ▼
   AI parses thesis description
       │
       ▼
   Phase 1: Google Maps → SQLite seeds
       │
       ▼
   Phase 2: Website crawl → GPT-4 → SQLite enrichment
       │
       ▼
   Send completion email to user
```

---

## Backend Setup (`exit_mna_tool/`)

### Prerequisites
- Python 3.10+
- A Google Maps API key
- An OpenAI API key
- Gmail credentials (for email notifications)

### 1. Create Virtual Environment

```bash
cd exit_mna_tool
python -m venv venv
source venv/bin/activate      # macOS/Linux
venv\Scripts\activate         # Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in `exit_mna_tool/`:

```env
OPENAI_API_KEY=your_openai_api_key
GOOGLE_MAPS_API_KEY="your_google_maps_api_key"
SMTP_USER="EMAIL_ADDRESS"
SMTP_PASSWORD="PASSWORD"
```

### 4. Run the Backend

```bash
to bring up the backend server
python -m src.application
or
run pipeline directly end to end from CLI
python -m src.pipeline run  
```

The API will start at `http://localhost:5000`.

---

## Frontend Setup (`dashboard/`)

### Prerequisites
- Node.js v18+
- A Google Maps JavaScript API key

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in `dashboard/`:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Run the Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:8080`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/generate-config` | Parse thesis via AI and start pipeline |
| `GET` | `/thesis-names` | List all available thesis pipelines |
| `POST` | `/companies-by-thesis` | Return companies for a given thesis |

### `POST /generate-config`

```json
{
  "description": "Looking for privately held specialty tax firms with R&D tax credit services...",
  "email": "user@example.com"
}
```

### `POST /companies-by-thesis`

```json
{ "thesis_name": "Specialty Tax Advisory Services" }
```

---

## Authentication

The dashboard uses role-based authentication with session persistence in `localStorage`.

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@taxtarget.com | admin123 | Full access |
| Viewer | viewer@taxtarget.com | viewer123 | Read-only |

> **Note:** Replace the `DEMO_USERS` array in `AuthContext.tsx` with a real authentication API for production.

---

## Tech Stack

### Backend
| Library | Purpose |
|---|---|
| Flask | REST API framework |
| Flask-CORS | Cross-origin request support |
| OpenAI | Company website analysis |
| BeautifulSoup4 | HTML parsing / web scraping |
| SQLite3 | Local database |
| python-dotenv | Environment variable management |
| requests | HTTP client |

### Frontend
| Library | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| Tailwind CSS + shadcn/ui | Styling and components |
| Framer Motion | Animations |
| Recharts | Data visualization |
| Google Maps API | US Map |
| React Router v6 | Client-side routing |
| TanStack Query | Data fetching |
| SheetJS | Excel export |

---

## Deployment


### Frontend
```bash
cd dashboard
npm run build
```

Deploy the `dist/` folder to any static hosting provider (Vercel, Netlify, etc.).

---

## Available Scripts (Frontend)

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests (Vitest) |

---

## Environment Variables Reference

### Backend (`exit_mna_tool/.env`)
| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 analysis |
| `GOOGLE_MAPS_API_KEY` | Google Maps Places API key |

### Frontend (`dashboard/.env`)
| Variable | Description |
|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key |

> ⚠️ Never commit `.env` to source control. Both are already in `.gitignore`.
