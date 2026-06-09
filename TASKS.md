# Build & run — task queue

Work top to bottom. Check items off as you complete them. After each milestone, confirm the
app still runs and make a commit. Stop and ask if a task conflicts with what's actually in the repo.

---

## M0 — Orient (do this first)

- [ ] Read `CLAUDE.md` and `docs/api-contract.md`.
- [ ] Inventory the repo: identify the entry point, how the UI is structured, and how claim
      state is held today. Summarize findings in a short comment on the PR/branch.
- [ ] Get the existing prototype running. Record the **exact** commands in `CLAUDE.md` →
      "How to run".
- [ ] Mark where submission, uploads, and payment are currently simulated.

## M1 — Front-end data layer

- [ ] Extract all data operations into a single `apiClient` module:
      `submitClaim`, `listClaims`, `getClaim`, `decideClaim`.
- [ ] Add a **mock transport** behind the client so the app runs on seed data when no API base
      URL is configured.
- [ ] Replace the in-component simulated logic with `apiClient` calls. The prototype must
      behave exactly as before.

## M2 — Backend

- [ ] Scaffold a Node + Express server in `/server` implementing `docs/api-contract.md`.
- [ ] JSON-file (or in-memory) datastore seeded with 3–5 example claims spanning statuses
      (submitted, in_review, paid, denied).
- [ ] Endpoints: `POST /v1/claims`, `GET /v1/claims`, `GET /v1/claims/:id`,
      `POST /v1/claims/:id/decisions`.
- [ ] Server computes `totalBilledCents`, validates payloads, and returns the error envelope
      from the contract.
- [ ] `npm run server` documented and working on port 3001.

## M3 — Wire it together

- [ ] Point `apiClient` at the backend via env var, falling back to the mock.
- [ ] Submission persists; the confirmation screen shows the **server-issued** reference number.
- [ ] Tracking reads live claims; the timeline reflects real status and event dates.

## M4 — Adjudicator console

- [ ] Add a role switch (member / adjudicator) rendering separate views.
- [ ] Queue: claims needing action, with search, status filter, and summary counts.
- [ ] Claim detail with actions — approve (amount), deny (reason), request info (note) — each
      calling `POST /v1/claims/:id/decisions`.
- [ ] After an action, status, decision fields, and the event log update.

## M5 — Quality & docs

- [ ] Tests: client-side validation rules and the decisions endpoint (happy path + invalid input).
- [ ] `README.md`: what it is, a screenshot, the stack, run instructions, and an honest scope note.
- [ ] Add `.env.example` and a `.gitignore` covering `node_modules/` and `.env`.
- [ ] Final check: app runs from a clean clone using only the documented steps.

---

## Out of scope — do not do without asking

- Real PHI, real payments, or external eligibility/clearinghouse integrations.
- Replacing the JSON store with a hosted database.
- Real auth providers beyond a simple stubbed role switch.
