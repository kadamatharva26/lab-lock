# LabLock — API Reference

The full machine-readable spec is served by core-service at **`http://localhost:4000/docs`** (Swagger UI) once the stack is running. This document is a quick human-readable summary.

All requests below are prefixed with the gateway URL: `http://localhost:4000`.

Auth: every endpoint except `/api/auth/login` and `/api/auth/signup` requires a `Authorization: Bearer <jwt>` header. The token is issued by `/api/auth/login` or `/api/auth/signup` and stored client-side in Zustand-persisted state.

## Standard error shape

All error responses follow:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": []   // optional; e.g. conflict reasons
  }
}
```

| HTTP | code examples |
|------|---------------|
| 400  | `VALIDATION_ERROR` |
| 401  | `UNAUTHORIZED`, `INVALID_TOKEN` |
| 403  | `FORBIDDEN` |
| 404  | `NOT_FOUND` |
| 409  | `BOOKING_CONFLICT`, `INVALID_TRANSITION` |
| 500  | `INTERNAL_ERROR` |

## Auth (proxied to auth-service)

### POST /api/auth/signup
Create a new account.

```json
{ "name": "Asha", "email": "asha@bits.edu", "password": "string≥8", "role": "student" }
```
Roles allowed at signup: `student`, `supervisor`. Admin must be seeded.

Returns `{ token, user }`.

### POST /api/auth/login
```json
{ "email": "...", "password": "..." }
```
Returns `{ token, user }`.

### GET /api/auth/me
Returns the decoded user from the bearer token.

## Equipment (core)

### GET /api/equipment
Query params:
- `search` — substring match on name or category
- `category` — exact match
- `available=YYYY-MM-DD` — adds `busyOnDate: true|false` to each row
- `page` (default 1), `pageSize` (default 20, max 100)

Returns `{ data: Equipment[], page, pageSize, total, totalPages }`.

### GET /api/equipment/:id
Returns equipment with `labRoom`, `supervisor`, and an `upcoming[]` list of approved/requested bookings in the next 14 days. For non-admins the upcoming list is opaque (no requester name).

### POST /api/equipment  *(admin)*
```json
{ "name": "...", "category": "...", "labRoomId": "...", "quantity": 1, "condition": "good", "supervisorId": "...", "notes": "..." }
```

### PUT /api/equipment/:id  *(admin)*
Partial update; same body as POST.

### DELETE /api/equipment/:id  *(admin)*
Soft delete (sets `isActive=false`). Returns `204`.

## Lab rooms

### GET /api/lab-rooms
Returns `{ data: LabRoom[] }`. Used by the admin equipment form.

## Bookings (core)

### GET /api/bookings
Query params:
- `mine=1` — only bookings where the caller is the requester
- `status=requested|approved|in_use|returned|rejected|cancelled`
- `equipmentId=…`
- `from=YYYY-MM-DD`, `to=YYYY-MM-DD`

Admins can list everything; non-admins are scoped to their own bookings or those they supervise.

### GET /api/bookings/:id
Returns the booking with equipment, requester, supervisor, and `history[]`.

### POST /api/bookings
```json
{
  "equipmentId": "…",
  "startTime": "2026-05-10T09:00:00Z",
  "endTime":   "2026-05-10T11:00:00Z",
  "purpose":   "Free body diagram lab"
}
```
Validations:
- `endTime > startTime`
- `startTime >= now`
- duration ≤ 4 hours
- `startTime <= now + 30 days`

If any conflict rule fires, returns `409 BOOKING_CONFLICT` with:

```json
{
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "Cannot book this slot",
    "details": [
      { "type": "EQUIPMENT_BUSY", "message": "Already booked 09:30–10:00 by Asha", "conflictWith": "<bookingId>" },
      { "type": "SUPERVISOR_BUSY", "message": "Dr. R is supervising another booking 10:00–11:00", "conflictWith": "<bookingId>" },
      { "type": "SUPERVISOR_UNAVAILABLE", "message": "Dr. R is unavailable on 2026-05-10" }
    ]
  }
}
```

### PATCH /api/bookings/:id/status
```json
{ "status": "approved", "note": "...", "rejectReason": "..." }
```
Transitions allowed:

| from → to | who |
|-----------|-----|
| requested → approved | admin |
| requested → rejected | admin (must include `rejectReason`) |
| requested → cancelled | requester |
| approved → in_use | admin |
| approved → cancelled | requester or admin |
| in_use → returned | admin |

A `409 INVALID_TRANSITION` is returned otherwise.

## Dashboard (admin)

### GET /api/dashboard/summary
Returns:
```json
{
  "data": {
    "totalEquipment": 15,
    "activeToday": 3,
    "pending": 4,
    "thisWeek": 11,
    "utilization": [
      { "equipmentId": "…", "name": "Oscilloscope", "hoursLast30Days": 47.5 }
    ]
  }
}
```
Sorted descending by `hoursLast30Days`.

## Sample curl flow

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@lablock.local","password":"password123"}' | jq -r .token)

curl -s http://localhost:4000/api/equipment -H "Authorization: Bearer $TOKEN" | jq

curl -s -X POST http://localhost:4000/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"equipmentId":"…","startTime":"2026-05-10T09:00:00Z","endTime":"2026-05-10T11:00:00Z","purpose":"Test"}'
```
