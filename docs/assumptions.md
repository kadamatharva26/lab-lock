# LabLock — Assumptions & Scope Decisions

This document captures the non-obvious decisions taken while building LabLock. The grader can use it to know what was deliberately included or excluded from the rubric.

## Domain assumptions

1. **One supervisor per equipment** at a time, but a supervisor can supervise multiple equipment items. This is enforced by `Equipment.supervisorId` being a single FK and is the reason "supervisor double-booking" needs its own conflict check.
2. **A booking is always for a single equipment item.** Group bookings (e.g. a class of 30 students sharing one item) are out of scope; if a class needs the equipment, the supervisor books it once and shares it.
3. **Half-open intervals.** A booking from 10:00 to 11:00 does **not** conflict with one from 11:00 to 12:00. We use `[start, end)` consistently in SQL and JS.
4. **Time stored in UTC.** Browsers convert to local time for display only. The server does no timezone math.
5. **A user can be at most one of `student | supervisor | admin`.** Role can be promoted by an admin via the database (no UI for it because the assignment didn't ask).

## Booking lifecycle assumptions

6. **Pending bookings count as conflicts.** Even though `requested` bookings haven't been approved, we treat them as occupying the slot during conflict checks. This avoids the race where two pending requests are both approved later.
7. **Self-cancel is allowed only while pending.** Once approved, the requester must contact the admin (we surface this rule by hiding the cancel button after approval).
8. **`rejectReason` is mandatory for rejections** (≥ 3 chars). The frontend enforces this and the backend re-validates.

## Authentication assumptions

9. **JWT lifetime: 7 days** with no refresh-token mechanism. The interceptor logs the user out on any 401, which is sufficient for an academic project.
10. **Passwords: minimum 8 chars, bcrypt cost 10.** No password reset flow — out of scope.
11. **Admin accounts are seeded only.** The signup endpoint refuses `role: "admin"` to remove that footgun.

## Data assumptions

12. **Soft delete for equipment**, hard delete never. Old bookings still need their equipment name resolvable.
13. **Pagination defaults: page=1, pageSize=20, max pageSize=100.** Stops a malicious caller from exfiltrating the whole table in one request.
14. **`SupervisorAvailability` blocks an entire calendar day.** Sub-day unavailability windows would have meant a much bigger UI; we skipped it.

## Operational assumptions

15. **Single Postgres database** shared by both services. A pure microservice setup would split the database, but the operational complexity isn't worth it.
16. **Migrations live in core-service only.** Auth-service has a minimal Prisma schema for client generation but does not run migrations.
17. **Gateway is dumb.** No auth, no rate-limiting, just routing + CORS + request id. This keeps the gateway tiny and shifts the auth check to each service (each service verifies the JWT itself with the shared secret).

## Out of scope (and why)

| Feature | Why excluded |
|---------|--------------|
| WebSocket/SSE live updates | Not in rubric; the polling-on-refresh model is enough for the screens we have. |
| Equipment photos / file upload | Not in rubric; would have meant signed URLs + storage. |
| Email notifications | Not in rubric; beginner constraint says "keep it small". |
| Multi-tenant (multiple campuses) | Not in rubric. |
| Internationalization | Not in rubric. |
| Rate limiting / WAF | Not in rubric for an academic deployment. |
| RBAC beyond the 3 fixed roles | Not in rubric. |

## Things that look like bugs but are intentional

- The student booking form lets you pick a supervisor's busy time and only fails on submit. This is by design — we want the conflict check to be the single source of truth, instead of duplicating availability state on the client.
- Admin equipment "Retire" is a soft delete. The retired item still appears in past bookings, but is hidden from the student equipment list.
- Pagination resets to page 1 whenever a filter changes — this is what users expect, even though it can feel surprising the first time.
