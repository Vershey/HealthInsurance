# Document Extraction — AI Bill Scanner

## Overview

The **Auto-fill from a bill** feature on Step 3 (Provider & charges) lets members upload an itemized medical bill (PDF or image). Claude reads the document and extracts the provider name, date of service, and line-item charges into a review panel. The member confirms or edits the data before it is applied to the claim form.

## How it works

```
Member uploads bill
       │
       ▼
Front end (apiClient.extractCharges)
       │  POST /v1/extract-charges  (multipart, field: "bill")
       ▼
Express server
       │  Sends image/PDF as base64 to Claude API
       ▼
Claude vision (claude-haiku-4-5-20251001)
       │  Returns JSON: { provider, dateOfService, lines[] }
       ▼
ReviewExtractedCharges panel
       │  Member reviews and edits each line
       ▼
onApply → fills StepProvider form fields
```

## Components

### `src/ReviewExtractedCharges.jsx`

Self-contained React component. Accepts two props:

| Prop | Type | Description |
|------|------|-------------|
| `extract` | `async (file: File) => ExtractionResult` | Called with the selected file; returns extracted data |
| `onApply` | `(data: ExtractionResult) => void` | Called when the member clicks "Apply to claim" |

**ExtractionResult shape:**
```json
{
  "provider": "Princeton Family Care",
  "dateOfService": "2026-05-12",
  "lines": [
    { "code": "99396", "description": "Preventive visit, established patient", "amountCents": 32000 },
    { "code": "80053", "description": "Comprehensive metabolic panel", "amountCents": 12500 }
  ]
}
```

**States:**
- `idle` — shows the "Auto-fill from a bill" trigger button
- `loading` — spinner while extraction runs
- `review` — editable table of extracted lines + Apply / Cancel
- `error` — error message with option to try another file

### `src/apiClient.js` — `extractCharges(file)`

Sends the file to `POST /v1/extract-charges` when `VITE_API_URL` is configured, otherwise returns mock data after a 1.8 s delay so the UI works without a server.

### `server/index.js` — `POST /v1/extract-charges`

Accepts `multipart/form-data` with a `bill` field (PDF, PNG, JPEG, or WebP up to 10 MB).

- **With `ANTHROPIC_API_KEY`** — calls Claude with the file as a base64-encoded image or document block, parses the JSON response, and returns it.
- **Without `ANTHROPIC_API_KEY`** — returns static mock data so the endpoint still responds during development.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Set to `http://localhost:3001` to use the real backend |
| `ANTHROPIC_API_KEY` | No | Anthropic API key — enables real Claude extraction; falls back to mock if blank |

Set these in your local `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
# then edit .env and fill in your key
```

## Supported file types

| Format | Sent as |
|--------|---------|
| PNG | `image/png` image block |
| JPEG / JPG | `image/jpeg` image block |
| WebP | `image/webp` image block |
| PDF | `application/pdf` document block |

Maximum file size: **10 MB**.

## Claude prompt

The server sends this prompt with the uploaded file:

> Extract the billing information from this itemized medical bill. Return ONLY valid JSON in this exact shape:
> `{ "provider": "...", "dateOfService": "YYYY-MM-DD", "lines": [{ "code": "...", "description": "...", "amountCents": integer }] }`
> Include only actual line-item charges. Do not include totals, taxes, or payment rows as separate lines.

## Privacy & scope note

- The file is held in memory only during the request — it is never written to disk or stored.
- This is a **prototype**. Do not upload real PHI (protected health information) without a BAA in place with Anthropic.
- The member always reviews extracted data before it is applied — nothing is submitted automatically.
