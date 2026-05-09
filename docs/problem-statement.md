# Problem Statement — LabLock: Campus Lab Equipment Booking with Conflict Resolution

## Project Name

**LabLock** — a lab + equipment booking platform that prevents scheduling conflicts across three dimensions simultaneously: the equipment, the lab room it lives in, and the supervising faculty required to operate it.

## One-Paragraph Brief

On most engineering and science campuses, booking lab equipment involves a WhatsApp message, a physical logbook, or an email thread — all of which produce frequent conflicts where two students book the same oscilloscope, or a piece of equipment gets reserved while its supervising faculty is on leave. LabLock is a web platform where students request time slots on specific equipment, the system automatically blocks conflicts against the equipment itself, the lab room, and the required supervisor, and lab admins approve, reject, or reschedule requests through a single dashboard. The system enforces a state machine on each booking (`requested → approved → in_use → returned`, or `requested → rejected` / `cancelled`) and surfaces utilization analytics so the admin can identify under-used equipment and over-booked faculty.

## Why This Problem (for the innovation marks)

- **Non-trivial business rule:** three-dimensional conflict detection (equipment × room × supervisor) is harder than simple CRUD and genuinely differentiates this from the sample "lending portal."
- **State machine:** explicit booking lifecycle gives examiners something concrete to test.
- **Real pain:** every student on a BITS-style campus has personally experienced this, so the motivation story writes itself for the reflection report.

## User Personas

| Persona | Role | Primary Goals |
|---|---|---|
| **Aditi** (student) | `student` | Find available equipment, request a time slot, see request status, receive cancellation if supervisor unavailable |
| **Prof. Rao** (faculty / supervisor) | `supervisor` | See upcoming bookings that require them, mark themselves unavailable, approve/reject bookings in their scope |
| **Mr. Iyer** (lab admin) | `admin` | Add/edit equipment inventory, approve all bookings, override conflicts, view utilization dashboard |

## Core Use Cases (lock these — this is your scope)

### UC-1: Student signup and login

- **Actor:** any new user
- **Trigger:** visits `/signup`
- **Flow:** picks role (student / supervisor — admins are seeded), submits email + password + name → receives JWT
- **Acceptance criteria:**
  - Password stored bcrypt-hashed, never returned
  - Duplicate email returns 409
  - JWT valid for 24h, carries `userId` and `role`
  - Login form surfaces server-side errors

### UC-2: Admin manages equipment inventory

- **Actor:** `admin`
- **Trigger:** admin opens `/admin/equipment`
- **Flow:** create / edit / soft-delete equipment records
- **Fields:** name, category (e.g., `oscilloscope`, `3d-printer`), condition (`good` / `needs-service` / `broken`), quantity, lab room (FK), required supervisor (FK, nullable)
- **Acceptance criteria:**
  - Only `admin` role can write; other roles get 403
  - Soft-delete (isActive flag) so historical bookings keep their reference
  - Validation: quantity ≥ 1, name 2–80 chars

### UC-3: Student browses and filters equipment

- **Actor:** any logged-in user
- **Trigger:** opens `/equipment`
- **Flow:** sees paginated equipment list with filters (category, availability-on-date, lab)
- **Acceptance criteria:**
  - Server-side pagination (page size 20)
  - "Available on date X" filter runs a query against bookings table
  - Empty state when no results
  - Clicking an equipment row opens detail view with its upcoming bookings (time blocks visible, names hidden for students)

### UC-4: Student requests a booking (with three-way conflict check)

- **Actor:** `student` or `supervisor`
- **Trigger:** on equipment detail page, picks a date + start time + end time
- **Flow:**
  1. Frontend validates date/time format and that end > start
  2. Backend receives request and checks in a single transaction:
     - Equipment not already booked in that window (any overlapping booking with status `approved` or `in_use`)
     - Lab room not fully occupied (if room capacity is tracked)
     - Required supervisor has no other overlapping booking and is marked available that day
  3. If no conflict → status `requested`, returned to user with request ID
  4. If conflict → 409 response with a structured reason object: `{ conflicts: [{ type: "equipment" | "room" | "supervisor", with: <booking id or date> }] }`
- **Acceptance criteria:**
  - Overlap detection uses half-open intervals: `[start, end)` (so back-to-back bookings do not conflict)
  - Can't book in the past (400)
  - Can't book more than 30 days out (400)
  - Max 4 hours per booking (400)
  - Student receives email (or in-app toast — email optional) confirming submission

### UC-5: Admin / supervisor approves or rejects a booking

- **Actor:** `admin` or the specific `supervisor` on the equipment
- **Trigger:** opens `/bookings?status=requested`
- **Flow:** sees all pending bookings; clicks approve or reject; reject requires a reason
- **State transitions enforced server-side:**
  - `requested → approved` (admin or required supervisor)
  - `requested → rejected` (admin or required supervisor, reason required)
  - `approved → in_use` (admin marks at pickup)
  - `in_use → returned` (admin marks at return; condition-on-return optional field)
  - `requested → cancelled` (student who made the request, only if not yet approved)
- **Acceptance criteria:**
  - Invalid transition returns 422 with allowed transitions
  - Every transition writes a `booking_status_history` row with who + when + note

### UC-6: Admin dashboard with utilization analytics

- **Actor:** `admin`
- **Trigger:** opens `/admin/dashboard`
- **Flow:** sees summary cards (total equipment, active bookings today, pending approvals count) and a table of equipment ranked by booking hours over the last 30 days
- **Acceptance criteria:**
  - All queries run in one API call (`GET /dashboard/summary`)
  - Response time < 500 ms on seed data of ~100 bookings
  - Empty state when no data

## Out of Scope (say no to these explicitly)

- Payment / fees
- SMS or real email (use in-app toasts + console-log "email sent" for demo)
- Mobile native app
- Recurring bookings (single-session only)
- Waitlists (students must retry if rejected)

Defining these explicitly as out-of-scope in your README is itself a signal of engineering maturity and often earns the "Design" marks in the rubric.

## Success Criteria for Phase 1 (this session)

- [ ] This document committed to `docs/problem-statement.md`
- [ ] ER diagram committed to `docs/db-schema.md`
- [ ] Wireframes committed to `docs/wireframes.md`
- [ ] Monorepo folder structure exists
- [ ] Root README points at each document
- [ ] First push to public GitHub repo completed
