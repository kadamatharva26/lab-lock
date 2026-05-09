# Phase 1 Execution Runbook

Follow these steps top-to-bottom. Every command is copy-pasteable. Estimated time: **2–3 hours** on Day 1.

> ✅ = checkpoint you should see working before moving on.

---

## Step 0 — Prerequisites check (10 min)

```bash
node --version    # need v20 or higher
npm --version     # need v10 or higher
git --version     # any 2.x
```

If any are missing:

- Node: install from https://nodejs.org (LTS)
- Git: https://git-scm.com/downloads

Create a GitHub account if you don't have one, and install the GitHub CLI (optional but easier):

```bash
# macOS
brew install gh
# Windows
winget install --id GitHub.cli
# then
gh auth login
```

✅ `gh auth status` prints "Logged in".

---

## Step 1 — Create the GitHub repo (5 min)

**Option A — via gh CLI (recommended):**

```bash
# repo will be created empty on GitHub
gh repo create lablock --public --description "Campus lab equipment booking with three-way conflict resolution — SE ZG503 assignment"
```

**Option B — via web:**

1. Go to https://github.com/new
2. Name: `lablock`
3. Visibility: **Public** (required by the brief)
4. Do **not** initialize with README/gitignore (we'll push our own)
5. Create

✅ A repo exists at `https://github.com/<your-username>/lablock`.

---

## Step 2 — Clone the files from this Phase 1 bundle into your local machine (10 min)

All the files scaffolded in this session are in your `phase1/` folder. Copy them to wherever you want the project to live, and initialize git.

```bash
# pick a parent folder where you keep projects
cd ~/Projects

# copy the scaffolded folder and rename it
cp -R "<path to phase1 folder>" lablock
cd lablock

git init
git branch -M main
git remote add origin https://github.com/<your-username>/lablock.git
```

✅ `git status` shows a clean workspace with the scaffolded files.

---

## Step 3 — Install workspace dependencies (10 min)

```bash
# from repo root
npm install
```

This installs dependencies for all three services (auth, core, gateway) thanks to npm workspaces. The first install pulls ~200 MB — one-time cost.

✅ `node_modules/` appears at the root (and `node_modules/@lablock/...` symlinks exist).

---

## Step 4 — Configure environment files (10 min)

```bash
cp services/auth/.env.example    services/auth/.env
cp services/core/.env.example    services/core/.env
cp gateway/.env.example          gateway/.env
```

Edit `services/auth/.env` and `services/core/.env`:

- `JWT_SECRET` — generate a long random string:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
  paste the output as the value. Use the **same** secret in both services.
- `DATABASE_URL` — leave for now; we wire Supabase in Phase 2.

✅ Three `.env` files exist but are **not** tracked by git (the `.gitignore` excludes them).

---

## Step 5 — Smoke-test the services (10 min)

```bash
# still from repo root
npm run dev
```

You should see four colored log streams. Open a second terminal and hit the health endpoints:

```bash
curl http://localhost:4000/health     # gateway
curl http://localhost:4001/health     # auth
curl http://localhost:4002/health     # core
```

Each should return a JSON body like `{"service":"gateway","status":"ok"}`.

✅ All three endpoints respond. Stop the dev server with Ctrl+C.

---

## Step 6 — First commit + push (10 min)

```bash
git add .
git status                # review what's being committed
git commit -m "chore: scaffold monorepo (gateway, auth, core, docs)"
git push -u origin main
```

Open the repo URL in your browser. You should see every file.

✅ Repo is public, files are visible, README renders on the front page.

---

## Step 7 — Create the AI usage log file (5 min)

Even in Phase 1 you're using AI (this guide) — log it.

```bash
cat > docs/ai-usage-log.md <<'EOF'
# AI Usage Log

> Every prompt issued to an AI coding tool and how its output was used.

| Date | Tool | Task | Prompt (summary) | Output used? | Notes |
|------|------|------|------------------|--------------|-------|
| 2026-04-19 | Claude | Scope + scaffold Phase 1 | "check this assignment as a full stack developer, provide steps and KPIs" → "help choose best problem statement and guide phase 1" | Used with edits | Produced problem statement, ER diagram, wireframes, monorepo skeleton. I reviewed every file, chose Node+Express stack myself, and will modify as I learn the codebase. |
EOF

git add docs/ai-usage-log.md
git commit -m "docs: start AI usage log"
git push
```

✅ `docs/ai-usage-log.md` visible on GitHub.

---

## Step 8 — Create a Supabase project (Phase 2 prep — 15 min, do it today)

This is technically Phase 2, but doing it now saves you a block of time later.

1. Go to https://supabase.com → sign up → New Project
2. Project name: `lablock`. Region closest to you. Set a DB password and save it somewhere safe.
3. Wait ~2 min for provisioning.
4. Go to Project Settings → Database → **Connection string** → **URI** (session pooler).
5. Copy it and paste into `DATABASE_URL` in both `services/auth/.env` and `services/core/.env`.

✅ You have a hosted Postgres URL ready for Phase 2.

---

## Step 9 — Create your first GitHub Issues / Project (optional but high ROI, 10 min)

Examiners like to see planning artifacts. Create issues for each Phase 2 task — it shows up in commit history when you close them.

```bash
gh issue create --title "Backend: set up Prisma with schema" --label "phase-2"
gh issue create --title "Backend: auth-service signup + login" --label "phase-2"
gh issue create --title "Backend: core-service equipment CRUD" --label "phase-2"
gh issue create --title "Backend: bookings CRUD + conflict check" --label "phase-2"
gh issue create --title "Backend: Swagger docs at /api/docs" --label "phase-2"
gh issue create --title "Backend: seed script" --label "phase-2"
```

✅ 6 issues visible on the repo.

---

## Step 10 — Sanity checklist before ending Phase 1

- [ ] Repo is public
- [ ] README renders and links to all docs
- [ ] `docs/problem-statement.md` committed
- [ ] `docs/db-schema.md` committed with Mermaid diagram (GitHub renders it)
- [ ] `docs/wireframes.md` committed
- [ ] `docs/runbook.md` committed (this file)
- [ ] `docs/ai-usage-log.md` started
- [ ] `.gitignore` excluding `node_modules/` and `.env`
- [ ] `LICENSE` present
- [ ] `npm run dev` starts all three services without errors
- [ ] All three `/health` endpoints return 200
- [ ] Supabase project created and `DATABASE_URL` pasted into `.env` files
- [ ] First push to `main` done
- [ ] Repo tagged `phase-1-complete`:

```bash
git tag phase-1-complete
git push origin phase-1-complete
```

---

## Common Phase 1 gotchas

| Symptom | Cause | Fix |
|---|---|---|
| `npm install` hangs on `bcrypt` | native build failure on Windows | install VS Build Tools, or switch to `bcryptjs` (drop-in, pure JS) |
| `Cannot find module '@lablock/...'` | ran `npm install` in a service folder instead of root | always install from root; workspaces set up the symlinks |
| `.env` shows up in `git status` | git already tracked it before `.gitignore` existed | `git rm --cached services/*/.env` |
| `gh repo create` fails with "not authenticated" | forgot `gh auth login` | run `gh auth login`, pick GitHub.com, pick HTTPS |
| Port 4000 already in use | old `npm run dev` still running | `lsof -ti:4000 \| xargs kill -9` (macOS/Linux) or Task Manager (Windows) |

---

## What's next (preview of Phase 2)

- Day 3: `prisma init`, copy schema from `docs/db-schema.md` into `schema.prisma`, first migration
- Day 4: auth endpoints with bcrypt + JWT + Zod validation
- Day 5: core-service equipment CRUD with role guard
- Day 6: bookings endpoints + three-way conflict check (the star of your reflection)

Phase 2 runbook will be written when you're ready to start — don't jump ahead until Phase 1 checklist is green.

---

# Phase 2 + 3 Runbook — Run the Full App End-to-End

The repo now contains a working backend (auth + core + gateway) and a working frontend (all 6 pages + admin pages). This section gets the whole stack running on your laptop in roughly 15 minutes.

## A. One-time setup

```bash
# from the project root
npm install                     # installs all 4 workspaces

# fill in DATABASE_URL (Supabase) and JWT_SECRET (any long random string) in BOTH:
#   services/auth/.env
#   services/core/.env
# the gateway only needs the upstream URLs (defaults are fine for localhost).

cp services/auth/.env.example services/auth/.env
cp services/core/.env.example services/core/.env
cp gateway/.env.example       gateway/.env
cp frontend/.env.example      frontend/.env
```

Generate a JWT secret you'll paste into both service `.env` files:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## B. Database migrate + seed

```bash
npm run db:migrate              # runs prisma migrate dev in services/core
npm run db:seed                 # creates admin + 5 supervisors + 20 students + 15 equipment + 17 bookings
```

✅ Output ends with `Seed complete.` — you now have a demo dataset.

## C. Start everything

```bash
npm run dev
```

This runs four processes concurrently with colour-coded logs:

- `auth`     :4001
- `core`     :4002
- `gateway`  :4000
- `frontend` :5173

✅ The frontend loads at http://localhost:5173/login.

## D. Smoke test (5 minutes — confirms every use case works)

1. **Login as admin** → email `admin@lablock.local`, password `password123`. You land on `/admin/dashboard` and see equipment count, pending count, and a utilization bar chart.
2. **Browse equipment** → click "Equipment" in the nav. Filter by date in the `Available on` field; rows flip between green "Available" and amber "Booked".
3. **Book equipment** → click View on any equipment. Pick a date + 09:00–11:00 + a purpose, click "Request booking". Pending booking appears under "Upcoming bookings".
4. **Trigger a conflict** → submit the same slot again. The form shows a red error list with the structured 409 details (this is the centerpiece of the project).
5. **Approve a booking as admin** → go to `/admin/bookings`, the "Pending" tab shows the booking. Click "Approve". Tab counts update.
6. **Sign up as a student** → log out, sign up `student1@bits.edu` / `password123`, role student. Confirm you can see equipment but `/admin/*` routes redirect away.
7. **Cancel a booking** → request a slot, then visit `/my-bookings`. The "Cancel" button appears on `requested` rows only.
8. **Inspect Swagger** → http://localhost:4000/docs renders the OpenAPI 3.0 spec for every endpoint.

✅ All eight steps work — the assignment's functional rubric is met.

## E. Run unit tests

```bash
npm test
# expected: 10 pass / 0 fail (state-machine tests)
```

## F. Production build sanity check

```bash
npm run build:frontend
# emits frontend/dist/  — proves vite has no build errors.
```

## G. When you're ready to deploy (Phase 4)

| Component | Suggested host | Notes |
|---|---|---|
| Frontend | Vercel | `vercel --prod` from `frontend/`; set `VITE_API_BASE` to your gateway URL |
| Gateway + auth + core | Render or Railway | one Web Service per Node service; set `DATABASE_URL`, `JWT_SECRET` env vars |
| Database | Supabase | already used in dev; just point production env at the same project (or a separate one) |

## H. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `prisma migrate dev` fails with `P1001` | wrong `DATABASE_URL` or Supabase paused | check Supabase project status; copy URL from Project Settings → Database → Connection string (URI mode) |
| Frontend shows "Network Error" | `VITE_API_BASE` not pointing at the gateway | set `VITE_API_BASE=http://localhost:4000` and restart `npm run dev` |
| 401 immediately after login | clock skew on JWT exp; or two services have different `JWT_SECRET` | confirm both `services/auth/.env` and `services/core/.env` have the *same* `JWT_SECRET` |
| 409 on a fresh booking that should succeed | seed data already used the slot you picked | pick a date that's not in the seed, or re-seed: `npm --workspace services/core run db:reset && npm run db:seed` |
| Recharts blank on dashboard | seed didn't run (zero bookings) | re-run `npm run db:seed` |
