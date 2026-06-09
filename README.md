# Meridian Health — Claim Portal

A full-stack health insurance claim portal for member reimbursement submissions and adjudicator review.

## What it is

**Member portal** — a guided 6-step flow to submit out-of-network reimbursement claims, attach documents, choose a payment method, and track claims to resolution.

**Adjudicator console** — a staff review queue with approve / deny / request-info actions and a full event log per claim.

## Stack

- **Front end:** React 19 + Vite, self-contained CSS-in-JS, lucide-react icons
- **Backend:** Node.js + Express, JSON-file datastore (no external database)
- **API:** REST/JSON — see `docs/api-contract.md`

## How to run

### Front end only (mock data, no server needed)

```bash
npm install
npm run dev
```

Open **http://localhost:5173**

### Full stack (real backend + persisted data)

**Terminal 1 — backend:**
```bash
npm run server
```
Runs on **http://localhost:3001**

**Terminal 2 — front end:**
```bash
cp .env.example .env   # sets VITE_API_URL=http://localhost:3001
npm run dev
```

Open **http://localhost:5173**

## Configuration

Copy `.env.example` to `.env`:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | *(blank — uses mock)* | Backend base URL |
| `PORT` | `3001` | Server port |

When `VITE_API_URL` is blank the front end runs entirely on in-memory seed data — no server required.

## Scope note

This is a **prototype/demo**. It does not integrate real PHI, real payment rails, or real eligibility systems. The JSON datastore resets to seed data when `server/db.json` is deleted.
