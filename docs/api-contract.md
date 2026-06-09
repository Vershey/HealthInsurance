# Claims API — REST/JSON contract (v1)

The contract the front end consumes and the backend implements. Place at `docs/api-contract.md`.

## Conventions

- JSON request/response bodies (`Content-Type: application/json`).
- Auth: `Authorization: Bearer <token>` on every request.
- **Money: integer minor units (cents), USD.** `8450` = $84.50. Never floats.
- Timestamps: ISO-8601 UTC (`2026-06-09T14:03:00Z`). Dates: `YYYY-MM-DD`.
- IDs: opaque, prefixed (`clm_…`). Base path: `/v1`.
- `POST /v1/claims` accepts an `Idempotency-Key` header; replaying it returns the original result.

### Error envelope

```json
{ "error": { "code": "validation_failed", "message": "Routing number must be 9 digits.", "fields": { "reimbursement.routing": "invalid" } } }
```

Codes: `unauthorized` (401), `forbidden` (403), `not_found` (404), `validation_failed` (422),
`conflict` (409), `server_error` (500).

## Status lifecycle

```
submitted ──▶ in_review ──▶ approved ──▶ paid
                  │  ▲          │
                  ▼  │          ▼
            info_needed       denied
```

Enum: `submitted | in_review | info_needed | approved | denied | paid`.

## Endpoints

| Method | Path | Who | Purpose |
|---|---|---|---|
| `POST` | `/v1/claims` | Member | Submit a new claim |
| `GET` | `/v1/claims` | Both | List claims (scoped + filtered) |
| `GET` | `/v1/claims/{id}` | Both | Full claim detail + event log |
| `POST` | `/v1/claims/{id}/decisions` | Adjudicator | Approve / deny / request info |

### `POST /v1/claims`

Request (no `id`/`status` — the server assigns them):

```json
{
  "type": "medical",
  "member":  { "memberId": "MRD-8842013", "name": "Jordan Avery", "dob": "1989-03-14", "groupNumber": "100244" },
  "patient": { "name": "Jordan Avery", "relationship": "self" },
  "service": { "dateOfService": "2026-05-12", "placeOfService": "office", "emergency": false, "reason": "Annual physical and bloodwork" },
  "provider": { "name": "Princeton Family Care", "npi": "1639271845", "address": "12 Nassau St, Princeton NJ" },
  "charges": {
    "lines": [
      { "code": "99396", "description": "Preventive visit, established patient", "amountCents": 32000 },
      { "code": "80053", "description": "Comprehensive metabolic panel", "amountCents": 12500 }
    ],
    "balance": "outstanding"
  },
  "documents": [ { "name": "itemized-bill.pdf", "type": "itemized_bill", "sizeBytes": 184320 } ],
  "reimbursement": { "method": "direct_deposit", "accountLast4": "4417" }
}
```

`relationship` ∈ `self | spouse | dependent`. `balance` ∈ `paid_in_full | outstanding`.
`reimbursement.method` ∈ `direct_deposit | check`. Send only `accountLast4` — never raw bank numbers.

Response `201`: the full **Claim object** with `status: "submitted"`, a generated `reference`,
and an initial `submitted` event.

### `GET /v1/claims`

Query params: `role` (`member` scopes to caller's `memberId`; `adjudicator` returns the queue),
`memberId`, `status` (repeatable), `q` (search), `page`, `pageSize`.

```json
{ "data": [ /* Claim objects */ ], "page": 1, "pageSize": 20, "total": 37 }
```

### `POST /v1/claims/{id}/decisions`

```json
{ "action": "approve", "approvedAmountCents": 28000, "note": "Allowed amount per fee schedule.", "adjudicator": "a.morgan" }
```

- `approve` → requires `approvedAmountCents`; sets status `approved`.
- `deny` → requires `denialReason`; sets status `denied`.
- `request_info` → requires `note`; sets status `info_needed`.

`denialReason` ∈ `out_of_network | not_covered | duplicate | missing_docs | not_medically_necessary | other`.
Response `200`: the updated Claim object with a new event and populated `decision`.

## Claim object

```json
{
  "id": "clm_8f21",
  "reference": "CLM-2026-4471",
  "status": "in_review",
  "type": "medical",
  "member":  { "memberId": "MRD-8842013", "name": "Jordan Avery", "dob": "1989-03-14", "groupNumber": "100244" },
  "patient": { "name": "Jordan Avery", "relationship": "self" },
  "service": { "dateOfService": "2026-05-12", "placeOfService": "office", "emergency": false, "reason": "..." },
  "provider": { "name": "Princeton Family Care", "npi": "1639271845", "address": "..." },
  "charges": {
    "lines": [ { "code": "99396", "description": "Preventive visit", "amountCents": 32000 } ],
    "totalBilledCents": 44500,
    "balance": "outstanding"
  },
  "documents": [ { "id": "doc_1", "name": "itemized-bill.pdf", "type": "itemized_bill", "sizeBytes": 184320 } ],
  "reimbursement": { "method": "direct_deposit", "accountLast4": "4417" },
  "decision": { "approvedAmountCents": null, "denialReason": null, "note": null, "adjudicator": null, "decidedAt": null },
  "events": [
    { "at": "2026-05-15T09:12:00Z", "type": "submitted", "label": "Claim received", "by": "member" },
    { "at": "2026-05-16T10:40:00Z", "type": "in_review", "label": "Assigned for review", "by": "system" }
  ],
  "submittedAt": "2026-05-15T09:12:00Z",
  "updatedAt": "2026-05-16T10:40:00Z"
}
```

`event.type` ∈ `submitted | in_review | info_requested | approved | denied | paid`.

## Implementer notes

- `totalBilledCents` is **server-computed** from `charges.lines` — never trust a client total.
- Enforce scope server-side: `role=member` is constrained to the token's member regardless of
  the `memberId` param; the adjudicator role requires a staff token.
- The four-stage member timeline maps from status: Received (submitted) → In review (in_review /
  info_needed) → Decision (approved / denied) → Payment (paid). Drive dates from `events`.
- Payment (`paid`) is normally emitted by a disbursement step — expose it as an event so the
  member timeline advances.
