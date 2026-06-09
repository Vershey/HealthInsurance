# CLAUDE.md

Read this file fully before starting. Then read **TASKS.md** (the work queue) and
**docs/api-contract.md** (the API spec). Work the tasks in order; keep the app runnable
after every milestone and commit in small steps.

---

## Project: Meridian Health — claim portal

An end-to-end health insurance **claim portal**, in two halves:

- **Member portal** — submit a reimbursement claim through a guided multi-step flow, then
  track it to resolution.
- **Adjudicator console** *(to build)* — staff review queue with approve / deny /
  request-info actions.

**Current state:** a front-end prototype where submission, uploads, and payment are
simulated in-session (state resets on reload).
**Goal:** a runnable full-stack app — real backend, persisted data, and the adjudicator view.

---

## Stack

- **Front end:** HTML, CSS, JavaScript. *Inspect the repo first* to see whether it uses a
  framework or vanilla JS, and match the existing patterns — do not introduce a new
  framework without asking.
- **Backend (to build):** Node.js + Express, with a JSON-file or in-memory datastore. No
  external database — the app must run offline with seed data.
- **Wire format:** JSON over REST (see docs/api-contract.md).
- Node.js 18+ for tooling.

## How to run

> Verify these against the actual repo during M0 and correct them here.

- Front end: `npm install`, then `npm run dev` (or open `index.html`).
- Backend (after M2): `npm run server` on port `3001`.

---

## Core flows (preserve these — they define the product)

**Member submission — six steps, validated at each one:**
1. **Member & policy** — member ID, policyholder, DOB, relationship; the patient-name field
   appears only when relationship is not "self".
2. **Care details** — type (medical / dental / vision / pharmacy / mental health), date and
   place of service, emergency flag, reason.
3. **Provider & charges** — provider, NPI, and an itemized line-item table (add/remove rows)
   with a live running total.
4. **Documents** — upload with a required-vs-optional checklist; the itemized bill is required.
5. **Reimbursement** — direct deposit or mailed check; mask bank fields.
6. **Review & attest** — editable summary of every section, attestation checkbox, then
   submit → a confirmation screen with a server-issued reference number.

**Tracking ("My claims")** — search + status filters; each claim expands into a four-stage
timeline **Received → In review → Decision → Payment** that adapts to the claim's real state,
including paid and denied paths.

**Adjudicator console (to build)** — a queue of claims needing action; open a claim to see
full detail; act via approve (with amount) / deny (with reason) / request info (with note);
status and event log update.

---

## Data model & API

One resource: **claims**. Money is stored as **integer cents (USD)**. Status enum:
`submitted | in_review | info_needed | approved | denied | paid`. The full request/response
shapes live in **docs/api-contract.md** — implement the backend to that contract and have the
front end talk to it through a **single API-client module**.

---

## Conventions

- Route all data access through one `apiClient` module — no `fetch` calls scattered in UI code.
- The **server** computes line-item totals; never trust a total sent by the client.
- Validate on both client (format/required) and server (authoritative).
- Never store raw bank routing/account numbers — keep last 4 only.
- Small, focused commits with conventional messages (`feat:`, `fix:`, `chore:`).
- Match the repo's existing style; don't reformat files you aren't changing.

## Guardrails

- This is a **prototype/demo**, not a production claims system. Do **not** integrate real PHI,
  real payment rails, or real eligibility/clearinghouse systems.
- No secrets in the repo. Use a gitignored `.env`; commit a `.env.example`.
- Keep it runnable **offline** with seed data — no external service required to start.
- Ask before adding a database or any heavy dependency; default to Express + a JSON file.

## Definition of done (every task)

- The app runs with the documented commands from a clean clone.
- The affected flow works end to end against the backend.
- Lint passes and tests for the touched area pass.
- README and "How to run" above are updated if anything changed.
