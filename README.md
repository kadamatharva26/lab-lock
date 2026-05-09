# LabLock — Lab & Equipment Booking Platform



A web platform where students book campus lab equipment and the system automatically prevents conflicts across **three dimensions simultaneously**: the equipment itself, the supervising faculty, and that supervisor's calendar availability.

- 🔗 **Live frontend:** _to be added after deploy_
- 🔗 **Live API (Swagger):** _to be added after deploy_
- 🎥 **Demo video (Google Drive):** _to be added before submission_

---

## Problem

Lab equipment on campuses is typically booked via WhatsApp or paper logbooks, producing frequent double-bookings and unusable reservations when the supervising faculty is unavailable. LabLock solves this with a three-way conflict check on every booking request, an admin approval queue, and a utilization dashboard.

Full problem statement, personas, and use cases → [`docs/problem-statement.md`](docs/problem-statement.md).

## Architecture

```
 ┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
 │ React (Vite) │────▶│  API Gateway  │────▶│  auth-service    │
 │  Tailwind    │     │  (Express)    │     │  (JWT issuance)  │
 │  Zustand     │     │  :4000        │     │  :4001           │
 └──────────────┘     │               │     └──────────────────┘
                      │               │     ┌──────────────────┐
                      │               │────▶│  core-service    │
                      └───────────────┘     │  (equipment,     │
                                            │   bookings,      │
                                            │   dashboard)     │
                                            │  :4002           │
                                            └──────────────────┘
                                                     │
                                                     ▼
                                            ┌───────────────┐
                                            │  PostgreSQL   │
                                            │  (Supabase)   │
                                            └───────────────┘
```

- Architecture deep-dive (with sequence diagram) → [`docs/architecture.md`](docs/architecture.md)
- ER diagram & table details → [`docs/db-schema.md`](docs/db-schema.md)
- Wireframes → [`docs/wireframes.md`](docs/wireframes.md)
- Component hierarchy → [`docs/component-hierarchy.md`](docs/component-hierarchy.md)
- API reference → [`docs/api.md`](docs/api.md) (Swagger UI at `/docs` once running)
- Assumptions / scope decisions → [`docs/assumptions.md`](docs/assumptions.md)
- AI usage log → [`docs/ai-usage-log.md`](docs/ai-usage-log.md)
- Reflection (hand-written) → [`docs/reflection.md`](docs/reflection.md)

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React 18 + Vite + TailwindCSS + React Router + Zustand + Recharts | Fast scaffolding, minimal boilerplate |
| Backend | Node.js + Express (2 services + gateway) | Familiar; satisfies microservice requirement without over-engineering |
| ORM | Prisma | Type-safe queries + easy migrations |
| Database | PostgreSQL on Supabase | Free tier, hosted, no local setup pain |
| Auth | JWT (HS256) | Lightweight; brief permits "simulated" token auth |
| Docs | Swagger / OpenAPI 3.0 | Auto-rendered at `/docs` |
| Tests | `node:test` (built-in) | Zero install, ships with Node 20+ |
| Deploy | Vercel (frontend) + Render (services) + Supabase (DB) | All free tier |

## Repository Layout

```
lablock/
├── frontend/                 # React + Vite app
│   └── src/
│       ├── api/              # axios client + per-resource helpers
│       ├── components/       # AppLayout, ProtectedRoute, etc.
│       ├── pages/            # Login, Signup, EquipmentList, …, Admin*
│       ├── store/            # Zustand auth store (persisted)
│       ├── App.jsx           # router
│       └── main.jsx
├── gateway/                  # Express gateway — port 4000
├── services/
│   ├── auth/                 # auth-service — port 4001
│   │   └── src/{routes,middleware,lib}
│   └── core/                 # core-service — port 4002
│       └── src/{routes,middleware,lib,seed.js,swagger.js}
├── docs/                     # all documentation
├── package.json              # npm workspaces root
├── .gitignore
├── LICENSE
└── README.md
```

## Local Development — Quick Start

Prerequisites: Node 20+, npm 10+, and a free Supabase project for `DATABASE_URL`.

```bash
# 1. Install everything (npm workspaces installs all sub-projects)
npm install

# 2. Copy env templates and fill in DATABASE_URL + JWT_SECRET
cp services/auth/.env.example services/auth/.env
cp services/core/.env.example services/core/.env
cp gateway/.env.example       gateway/.env
cp frontend/.env.example      frontend/.env

# 3. Run migrations + seed demo data
npm run db:migrate            # core-service runs prisma migrate deploy
npm run db:seed               # creates admin + supervisors + students + equipment + bookings

# 4. Start all four processes (gateway, auth, core, frontend)
npm run dev
```

Once running:

| Service | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Gateway | http://localhost:4000 |
| Swagger UI | http://localhost:4000/docs |
| auth-service health | http://localhost:4001/health |
| core-service health | http://localhost:4002/health |

**Demo login (created by seed):** `admin@lablock.local` / `password123`. Two supervisor and two student accounts are seeded with the same password — see `services/core/src/seed.js` for the list.

## Running the Tests

```bash
# Backend unit tests (state machine + conflict engine helpers)
npm run test --workspace=services/core
```

## Use Cases (covered)

| ID | Use case | Where it lives |
|---|---|---|
| UC-1 | Sign up / log in | `frontend/src/pages/{Login,Signup}Page.jsx` + `services/auth/src/routes/auth.js` |
| UC-2 | Browse equipment, filter by date availability | `frontend/src/pages/EquipmentListPage.jsx` + `services/core/src/routes/equipment.js` |
| UC-3 | Request a booking with three-way conflict detection | `EquipmentDetailPage.jsx` + `services/core/src/lib/conflict.js` |
| UC-4 | Admin approves / rejects, marks in-use, marks returned | `AdminBookingsPage.jsx` + `services/core/src/lib/stateMachine.js` |
| UC-5 | Student views & cancels their own bookings | `MyBookingsPage.jsx` |
| UC-6 | Admin dashboard with utilization chart | `AdminDashboardPage.jsx` + `services/core/
## License

MIT — see [`LICENSE`](LICENSE).
