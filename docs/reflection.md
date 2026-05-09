# LabLock — Reflection

> **Note to me:** the assignment requires this file to be **my own writing, not AI-generated**. The headings and prompts below are a scaffold so I cover the rubric. Replace each "→" line with my own answer in 2–6 sentences before submitting. Length target: 1–2 pages.

---

## 1. What I built and why this problem

→ Briefly describe LabLock in one paragraph in my own words. Mention the target user (students booking lab equipment under supervisor approval) and the one rule that makes it interesting (three-way conflict detection across equipment, supervisor, and supervisor-availability).

→ Why I picked it over the other candidate problems I considered.

## 2. Architecture decisions I'm proud of

→ The three-service split (auth / core / gateway). Why I think it was worth the extra setup cost vs. a monolith.

→ The decision to put the conflict engine in a single pure function so I could unit-test it independent of HTTP. What that bought me when I was debugging.

## 3. Architecture decisions I'd revisit

→ One concrete thing I would do differently next time. (Examples to pick from: shared-database vs. per-service DB, JWT-in-localStorage vs. httpOnly cookies, polling vs. SSE for the admin queue.)

→ Why I made the call I did under time pressure, and what I'd need before changing it.

## 4. The hardest bug

→ Pick one real bug I hit. Describe the symptom, the wrong hypothesis I tried first, and what actually fixed it. Use the timeline of "I thought X → I tested it → it was Y" — that's what makes a reflection feel honest.

## 5. Testing approach and limits

→ What I unit-tested (state machine, conflict engine), what I tested manually with the seed data, and what I didn't get to (e.g. an end-to-end test of "admin rejects → student sees the reason").

→ One test I'd write next if I had another day.

## 6. Working with AI assistance

→ Which prompts genuinely saved time (architecture review, test case generation).

→ One time the AI was confidently wrong and I had to override it. How I caught it.

→ The discipline I tried to keep: "every line in the repo I can explain in my own words".

## 7. Working with the stack as a beginner

→ One thing about Prisma / Express / React / Tailwind that clicked for me during this project.

→ One thing I still don't fully understand and want to learn next.

## 8. What this would need to be production-ready

→ List 3–5 specific gaps. (Examples: rate-limiting on auth endpoints, refresh tokens, observability/logging beyond console.log, real audit log retention, accessibility audit, mobile testing.)

## 9. Time accounting (honest)

→ Roughly how I split the ~15 days. What took longer than I expected, what was faster.

## 10. What I'd tell next year's student about this assignment

→ One sentence of advice.

---

### Review checklist before submission
- [ ] Every "→" replaced with my own paragraph
- [ ] No bullet points copied from `ai-usage-log.md` or other docs
- [ ] Concrete details (filenames, function names, real numbers) rather than generic claims
- [ ] Within 1–2 pages
- [ ] Spell-checked
- [ ] Re-read once and made sure my own voice comes through
