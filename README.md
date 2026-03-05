# M&A Thesis Research Tool — Acquisition Target Screening Dashboard

A platform for screening and analyzing companies that align with theses.

---

## Overview

It is a web-based dashboard that aggregates public company data to help advisors and acquisition teams identify targets. It provides a filterable pipeline of companies alongside KPI summaries, geographic distribution maps, and ownership intelligence — all in a clean, modern interface.

---

## Features

- **📊 KPI Summary Cards** - Total companies, states covered, revenue data coverage, and ownership identification rate.
- **🗂 Company Pipeline Table** - Sortable & filterable by service type, with search and export-to-Excel.
- **🗺 US Map Visualization** - State-level markers showing company concentration via Google Maps API.
- **📈 Charts** - Service type distribution (pie) and geographic distribution (bar).
- **🏷 Ownership Flagging** - Highlights Private Equity-backed companies with a distinct badge.
- **👤 Key Contact Display** - Shows identified contacts per company.
- **🔐 Authentication** — Role-based access control with Admin and Viewer roles.
- **🔄 Multi-Pipeline Support** — Switch between investment theses/pipelines from a dropdown.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Charts | Recharts |
| Maps | Google Maps API (`@vis.gl/react-google-maps`) |
| Routing | React Router v6 |
| Data Fetching | TanStack Query (React Query) |
| Export | SheetJS (xlsx) |
| Testing | Vitest + Testing Library |

---

## Project Structure

```
dashboard/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx     # Route guard for authenticated access
│   │   ├── dashboard/
│   │   │   ├── Charts.tsx             # Pie + bar charts
│   │   │   ├── CompanyDetail.tsx      # Company detail modal
│   │   │   ├── CompanyTable.tsx       # Main filterable company table
│   │   │   ├── DashboardLayout.tsx    # Sidebar + top bar layout
│   │   │   ├── KPICards.tsx           # Summary stat cards
│   │   │   ├── PipelineForm.tsx       # Pipeline form
│   │   │   └── USMap.tsx              # Google Maps visualization
│   │   └── ui/                        # shadcn/ui component library
│   ├── contexts/
│   │   └── AuthContext.tsx            # Auth state, login/logout, RBAC
│   ├── data/
│   │   └── stateCoordinates.ts        # US state center coordinates
│   ├── pages/
│   │   ├── Index.tsx                  # Main dashboard page
│   │   └── Login.tsx                  # Authentication page
│   ├── types/
│   │   └── dashboard.ts               # Shared TypeScript interfaces
│   └── App.jsx                        # Root app with routing
├── .env                               # Environment variables (not committed)
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- A **Google Maps API key** with Maps JavaScript API enabled

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `dashboard/` directory:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

---

## Authentication

The dashboard uses role-based authentication. Demo credentials for development:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@taxtarget.com | admin123 | Full access |
| Viewer | viewer@taxtarget.com | viewer123 | Read-only |

> **Note:** Authentication is currently client-side using `localStorage`. For production, replace the `DEMO_USERS` array in `AuthContext.tsx` with a real API call.

---

## API Integration

The dashboard expects a backend API at the same origin. The following endpoints are used:

| Endpoint | Method | Description |
|---|---|---|
| `/api/pipelines` | GET | Returns available investment theses/pipelines |
| `/api/companies` | POST | Returns companies for a given thesis |

### Company Payload Shape

```json
{
  "id": 1,
  "name": "Acme Corp",
  "city": "Columbus",
  "state": "OH",
  "website": "https://acme.com",
  "services_readable": "R&D Tax Credit, Cost Segregation",
  "estimated_revenue": 5000000,
  "employee_count": 120,
  "ownership_type": "Private",
  "key_contact": "Jane Smith (CFO)",
  "data_source": "google_maps_places",
  "is_excluded": 0
}
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key |

> ⚠️ Never commit `.env` to source control. It is already in `.gitignore`.

---
