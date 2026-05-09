# LabLock — AI Usage Log

> The assignment requires that AI assistance be disclosed honestly. This log captures the prompts I used and how I incorporated the output. **The reflection (`reflection.md`) is written by me without AI assistance**, as required.

## Tools used
- **Claude (Anthropic)** — primary assistant, used for scaffolding, code review, and documentation drafts.
- **GitHub Copilot** — none in this project (kept disabled to avoid double-attribution).

## Prompt 1 — Picking a problem statement
**Prompt:** "I'm a beginner full-stack developer with about 15 days. Suggest a problem statement that has at least one non-trivial business rule (not just CRUD), is realistic for a campus, and works well for an SE assignment with admin/dashboard requirements."

**How used:** Took the suggestion of a "lab equipment booking system with three-way conflict detection (equipment × supervisor × supervisor availability)". Wrote my own use cases and personas after the brief was clear.

**My value-add:** The original suggestion didn't include the supervisor-availability dimension; I added it because it's the only one that requires a real business-rule check that goes beyond simple time overlap.

## Prompt 2 — Schema review
**Prompt:** "Review this Prisma schema for a booking system. Are the indexes right for the conflict queries I'll be running (overlap on (equipmentId, startTime, endTime) and (supervisorId, startTime, endTime))? Is anything missing for an audit trail?"

**How used:** Added a `BookingStatusHistory` table after the assistant pointed out I had no audit trail. Confirmed my composite indexes were right; added one more on `(requesterId, status)` for the "my bookings" filter view.

## Prompt 3 — Conflict engine sanity check
**Prompt:** "Here's my conflict-checking function. Walk through it as if you were code-reviewing me. What happens with back-to-back bookings (one ends at 11:00, next starts at 11:00)? What if the times are equal? What about a booking that fully contains another?"

**How used:** Confirmed I had the half-open interval logic right (`< end AND > start` → never matches an exact 11:00→11:00 boundary). The reviewer pointed out I needed to exclude the booking being edited (the `excludeBookingId` parameter) — I added that.

## Prompt 4 — JWT verification across services
**Prompt:** "If auth-service issues the JWT, how should core-service verify it without a network round-trip? What's the trade-off?"

**How used:** Went with shared `JWT_SECRET` (HS256) so core verifies tokens locally. Added a note in `assumptions.md` and `architecture.md` explaining the trade-off (rotation needs both services restarted).

## Prompt 5 — React structure for admin pages
**Prompt:** "I have an admin bookings queue with Approve/Reject actions. Reject needs a reason from the user. What's the cleanest React pattern for a modal that's specific to one row at a time?"

**How used:** Used the suggested pattern — a single `rejectFor` state variable holding either `null` or the booking id. The modal is rendered conditionally at the page level. Cleaner than per-row modal components.

## Prompt 6 — Wireframe ASCII art
**Prompt:** "Draw ASCII wireframes for these 6 screens: login, equipment list, equipment detail, my bookings, admin dashboard, admin bookings."

**How used:** Used the output as a starting point and adjusted layouts (moved the booking form to the right column instead of below the equipment header, and added the upcoming-bookings list).

## Prompt 7 — Documentation pass
**Prompt:** "Read these source files and write architecture.md and component-hierarchy.md. Don't add anything I didn't actually build."

**How used:** Used the drafts as a base, deleted any sections that referenced features I hadn't actually implemented, and corrected one place where the AI hallucinated a `<Notifications/>` component that doesn't exist in my code.

## Prompt 8 — Test cases for the state machine
**Prompt:** "Generate node:test test cases for this state machine. Cover: admin can approve, student cannot, requester can self-cancel pending only, invalid transitions return INVALID_TRANSITION."

**How used:** Took the suggested test cases verbatim, then added two of my own (reject requires reason, return-from-not-in-use fails).

## What I did NOT use AI for
- The reflection (`reflection.md`) — required by the assignment to be my own writing.
- Filling in real values in the seed script — picked names, lab numbers, course codes myself.
- The choice of which 3 microservices to split into — that's my own architecture call.
- Final testing on my machine.

## How AI changed my workflow
The biggest win was getting unblocked on architecture decisions (Prompts 2 and 4 saved me hours of doc-spelunking). The biggest discipline I had to keep was *not* shipping AI suggestions I didn't fully understand — every line that landed in the repo I can explain in my own words.
