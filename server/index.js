import express from "express";
import cors from "cors";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const __dir = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dir, "db.json");
const PORT = process.env.PORT || 3001;

// ── datastore ────────────────────────────────────────────────────────────────

function loadDb() {
  if (existsSync(DB_PATH)) {
    try { return JSON.parse(readFileSync(DB_PATH, "utf8")); } catch {}
  }
  return { claims: [], idempotency: {} };
}

function saveDb(db) {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getDb() { return loadDb(); }

// ── seed data ────────────────────────────────────────────────────────────────

const SEED = [
  {
    id: "clm_4471", reference: "CLM-2026-4471", status: "in_review", type: "medical",
    member: { memberId: "MRD-8842013", name: "Jordan Avery", dob: "1989-03-14", groupNumber: "100244" },
    patient: { name: "Jordan Avery", relationship: "self" },
    service: { dateOfService: "2026-05-12", placeOfService: "office", emergency: false, reason: "Annual physical and bloodwork" },
    provider: { name: "Princeton Family Care", npi: "1639271845", address: "12 Nassau St, Princeton NJ" },
    charges: {
      lines: [
        { code: "99396", description: "Preventive visit, established patient", amountCents: 32000 },
        { code: "80053", description: "Comprehensive metabolic panel", amountCents: 12500 },
      ],
      totalBilledCents: 44500, balance: "outstanding",
    },
    documents: [{ id: "doc_1", name: "itemized-bill.pdf", type: "itemized_bill", sizeBytes: 184320 }],
    reimbursement: { method: "direct_deposit", accountLast4: "4417" },
    decision: { approvedAmountCents: null, denialReason: null, note: null, adjudicator: null, decidedAt: null },
    events: [
      { at: "2026-05-15T09:12:00Z", type: "submitted", label: "Claim received", by: "member" },
      { at: "2026-05-16T10:40:00Z", type: "in_review", label: "Assigned for review", by: "system" },
    ],
    submittedAt: "2026-05-15T09:12:00Z", updatedAt: "2026-05-16T10:40:00Z",
  },
  {
    id: "clm_3920", reference: "CLM-2026-3920", status: "paid", type: "dental",
    member: { memberId: "MRD-8842013", name: "Jordan Avery", dob: "1989-03-14", groupNumber: "100244" },
    patient: { name: "Maya Reyes", relationship: "dependent" },
    service: { dateOfService: "2026-04-02", placeOfService: "office", emergency: false, reason: "Routine cleaning and X-rays" },
    provider: { name: "Bright Smiles Dental", npi: "", address: "45 Elm Ave, Trenton NJ" },
    charges: {
      lines: [{ code: "D1110", description: "Adult prophylaxis", amountCents: 32000 }],
      totalBilledCents: 32000, balance: "paid_in_full",
    },
    documents: [{ id: "doc_2", name: "dental-eob.pdf", type: "itemized_bill", sizeBytes: 92160 }],
    reimbursement: { method: "direct_deposit", accountLast4: "4417" },
    decision: { approvedAmountCents: 25600, denialReason: null, note: "Allowed per dental schedule.", adjudicator: "a.morgan", decidedAt: "2026-04-18T14:00:00Z" },
    events: [
      { at: "2026-04-04T08:00:00Z", type: "submitted", label: "Claim received", by: "member" },
      { at: "2026-04-05T09:00:00Z", type: "in_review", label: "Assigned for review", by: "system" },
      { at: "2026-04-18T14:00:00Z", type: "approved", label: "Approved", by: "a.morgan" },
      { at: "2026-04-24T10:00:00Z", type: "paid", label: "Payment sent", by: "system" },
    ],
    submittedAt: "2026-04-04T08:00:00Z", updatedAt: "2026-04-24T10:00:00Z",
  },
  {
    id: "clm_5102", reference: "CLM-2026-5102", status: "denied", type: "vision",
    member: { memberId: "MRD-8842013", name: "Jordan Avery", dob: "1989-03-14", groupNumber: "100244" },
    patient: { name: "Jordan Avery", relationship: "self" },
    service: { dateOfService: "2026-03-10", placeOfService: "office", emergency: false, reason: "Annual eye exam and new frames" },
    provider: { name: "ClearView Optometry", npi: "", address: "88 Commerce Blvd, Edison NJ" },
    charges: {
      lines: [
        { code: "92002", description: "Eye exam, new patient", amountCents: 15000 },
        { code: "V2020", description: "Frames", amountCents: 22000 },
      ],
      totalBilledCents: 37000, balance: "paid_in_full",
    },
    documents: [{ id: "doc_3", name: "vision-receipt.pdf", type: "itemized_bill", sizeBytes: 51200 }],
    reimbursement: { method: "check", accountLast4: null },
    decision: { approvedAmountCents: null, denialReason: "not_covered", note: "Frames not covered under current vision plan.", adjudicator: "r.patel", decidedAt: "2026-03-20T11:00:00Z" },
    events: [
      { at: "2026-03-12T07:30:00Z", type: "submitted", label: "Claim received", by: "member" },
      { at: "2026-03-13T09:00:00Z", type: "in_review", label: "Assigned for review", by: "system" },
      { at: "2026-03-20T11:00:00Z", type: "denied", label: "Claim denied", by: "r.patel" },
    ],
    submittedAt: "2026-03-12T07:30:00Z", updatedAt: "2026-03-20T11:00:00Z",
  },
  {
    id: "clm_6230", reference: "CLM-2026-6230", status: "info_needed", type: "mental",
    member: { memberId: "MRD-7721099", name: "Sam Torres", dob: "1995-07-22", groupNumber: "100244" },
    patient: { name: "Sam Torres", relationship: "self" },
    service: { dateOfService: "2026-05-28", placeOfService: "telehealth", emergency: false, reason: "Weekly therapy session" },
    provider: { name: "Mindwell Therapy", npi: "9876543210", address: "Telehealth" },
    charges: {
      lines: [{ code: "90837", description: "Psychotherapy, 60 min", amountCents: 20000 }],
      totalBilledCents: 20000, balance: "outstanding",
    },
    documents: [],
    reimbursement: { method: "direct_deposit", accountLast4: "8832" },
    decision: { approvedAmountCents: null, denialReason: null, note: "Please attach the provider's superbill.", adjudicator: "a.morgan", decidedAt: null },
    events: [
      { at: "2026-05-29T12:00:00Z", type: "submitted", label: "Claim received", by: "member" },
      { at: "2026-05-30T09:00:00Z", type: "in_review", label: "Assigned for review", by: "system" },
      { at: "2026-06-01T14:00:00Z", type: "info_requested", label: "Additional info requested", by: "a.morgan" },
    ],
    submittedAt: "2026-05-29T12:00:00Z", updatedAt: "2026-06-01T14:00:00Z",
  },
  {
    id: "clm_7815", reference: "CLM-2026-7815", status: "submitted", type: "pharmacy",
    member: { memberId: "MRD-7721099", name: "Sam Torres", dob: "1995-07-22", groupNumber: "100244" },
    patient: { name: "Sam Torres", relationship: "self" },
    service: { dateOfService: "2026-06-01", placeOfService: "pharmacy", emergency: false, reason: "Monthly prescription refill — lisinopril 10mg" },
    provider: { name: "CVS Pharmacy #4412", npi: "", address: "200 Main St, New Brunswick NJ" },
    charges: {
      lines: [{ code: "NDC12345", description: "Lisinopril 10mg, 30ct", amountCents: 4800 }],
      totalBilledCents: 4800, balance: "paid_in_full",
    },
    documents: [{ id: "doc_5", name: "pharmacy-receipt.jpg", type: "itemized_bill", sizeBytes: 38400 }],
    reimbursement: { method: "direct_deposit", accountLast4: "8832" },
    decision: { approvedAmountCents: null, denialReason: null, note: null, adjudicator: null, decidedAt: null },
    events: [{ at: "2026-06-02T08:15:00Z", type: "submitted", label: "Claim received", by: "member" }],
    submittedAt: "2026-06-02T08:15:00Z", updatedAt: "2026-06-02T08:15:00Z",
  },
];

function ensureSeeded() {
  const db = loadDb();
  if (db.claims.length === 0) {
    db.claims = SEED;
    saveDb(db);
  }
}

// ── validation ───────────────────────────────────────────────────────────────

function validErr(code, message, fields) {
  return { error: { code, message, fields: fields || {} } };
}

function validateClaim(body) {
  const fields = {};
  if (!body.type) fields.type = "required";
  if (!body.member?.memberId) fields["member.memberId"] = "required";
  if (!body.member?.name) fields["member.name"] = "required";
  if (!body.patient?.relationship) fields["patient.relationship"] = "required";
  if (!body.service?.dateOfService) fields["service.dateOfService"] = "required";
  if (!Array.isArray(body.charges?.lines) || body.charges.lines.length === 0) fields["charges.lines"] = "required";
  if (body.reimbursement?.method === "direct_deposit" && body.reimbursement?.accountLast4) {
    if (!/^\d{4}$/.test(body.reimbursement.accountLast4)) fields["reimbursement.accountLast4"] = "must be 4 digits";
  }
  return Object.keys(fields).length ? fields : null;
}

const VALID_ACTIONS = ["approve", "deny", "request_info"];
const VALID_DENIAL_REASONS = ["out_of_network", "not_covered", "duplicate", "missing_docs", "not_medically_necessary", "other"];

function validateDecision(body) {
  const fields = {};
  if (!VALID_ACTIONS.includes(body.action)) fields.action = `must be one of: ${VALID_ACTIONS.join(", ")}`;
  if (body.action === "approve" && !(body.approvedAmountCents > 0)) fields.approvedAmountCents = "required positive integer";
  if (body.action === "deny") {
    if (!body.denialReason) fields.denialReason = "required";
    else if (!VALID_DENIAL_REASONS.includes(body.denialReason)) fields.denialReason = `must be one of: ${VALID_DENIAL_REASONS.join(", ")}`;
  }
  if (body.action === "request_info" && !body.note?.trim()) fields.note = "required";
  if (!body.adjudicator?.trim()) fields.adjudicator = "required";
  return Object.keys(fields).length ? fields : null;
}

// ── app ──────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

app.use((_req, _res, next) => { ensureSeeded(); next(); });

// POST /v1/claims
app.post("/v1/claims", (req, res) => {
  const ikey = req.headers["idempotency-key"];
  if (ikey) {
    const db = getDb();
    if (db.idempotency[ikey]) return res.status(200).json(db.idempotency[ikey]);
  }

  const errs = validateClaim(req.body);
  if (errs) return res.status(422).json(validErr("validation_failed", "Validation failed.", errs));

  const db = getDb();
  const now = new Date().toISOString();
  const totalBilledCents = req.body.charges.lines.reduce((s, l) => s + (parseInt(l.amountCents) || 0), 0);
  const id = "clm_" + randomUUID().replace(/-/g, "").slice(0, 8);
  const reference = "CLM-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 8999);

  const claim = {
    id, reference, status: "submitted",
    type: req.body.type,
    member: req.body.member,
    patient: req.body.patient,
    service: req.body.service,
    provider: req.body.provider || {},
    charges: { lines: req.body.charges.lines, totalBilledCents, balance: req.body.charges.balance || "outstanding" },
    documents: (req.body.documents || []).map((d, i) => ({ ...d, id: `doc_${id}_${i}` })),
    reimbursement: req.body.reimbursement || {},
    decision: { approvedAmountCents: null, denialReason: null, note: null, adjudicator: null, decidedAt: null },
    events: [{ at: now, type: "submitted", label: "Claim received", by: "member" }],
    submittedAt: now, updatedAt: now,
  };

  db.claims.unshift(claim);
  if (ikey) db.idempotency[ikey] = claim;
  saveDb(db);
  res.status(201).json(claim);
});

// GET /v1/claims
app.get("/v1/claims", (req, res) => {
  const db = getDb();
  let claims = db.claims;
  const { role, memberId, status, q, page = 1, pageSize = 20 } = req.query;

  if (role === "member" && memberId) {
    claims = claims.filter((c) => c.member.memberId === memberId);
  }
  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    claims = claims.filter((c) => statuses.includes(c.status));
  }
  if (q) {
    const lq = q.toLowerCase();
    claims = claims.filter((c) =>
      (c.reference + c.provider.name + c.patient.name + (c.member?.name || "")).toLowerCase().includes(lq)
    );
  }

  const total = claims.length;
  const ps = parseInt(pageSize);
  const pg = parseInt(page);
  const data = claims.slice((pg - 1) * ps, pg * ps);
  res.json({ data, page: pg, pageSize: ps, total });
});

// GET /v1/claims/:id
app.get("/v1/claims/:id", (req, res) => {
  const db = getDb();
  const claim = db.claims.find((c) => c.id === req.params.id || c.reference === req.params.id);
  if (!claim) return res.status(404).json(validErr("not_found", "Claim not found."));
  res.json(claim);
});

// POST /v1/claims/:id/decisions
app.post("/v1/claims/:id/decisions", (req, res) => {
  const db = getDb();
  const idx = db.claims.findIndex((c) => c.id === req.params.id || c.reference === req.params.id);
  if (idx === -1) return res.status(404).json(validErr("not_found", "Claim not found."));

  const errs = validateDecision(req.body);
  if (errs) return res.status(422).json(validErr("validation_failed", "Validation failed.", errs));

  const claim = { ...db.claims[idx] };
  const { action, approvedAmountCents, denialReason, note, adjudicator } = req.body;
  const now = new Date().toISOString();

  if (action === "approve") {
    claim.status = "approved";
    claim.decision = { ...claim.decision, approvedAmountCents, note: note || null, adjudicator, decidedAt: now };
    claim.events = [...claim.events, { at: now, type: "approved", label: "Approved", by: adjudicator }];
  } else if (action === "deny") {
    claim.status = "denied";
    claim.decision = { ...claim.decision, denialReason, note: note || null, adjudicator, decidedAt: now };
    claim.events = [...claim.events, { at: now, type: "denied", label: "Claim denied", by: adjudicator }];
  } else if (action === "request_info") {
    claim.status = "info_needed";
    claim.decision = { ...claim.decision, note, adjudicator, decidedAt: now };
    claim.events = [...claim.events, { at: now, type: "info_requested", label: "Additional info requested", by: adjudicator }];
  }
  claim.updatedAt = now;
  db.claims[idx] = claim;
  saveDb(db);
  res.json(claim);
});

// POST /v1/extract-charges  (multipart: field "bill")
app.post("/v1/extract-charges", upload.single("bill"), async (req, res) => {
  if (!req.file) return res.status(422).json(validErr("validation_failed", "No file uploaded."));

  if (!anthropic) {
    // No API key — return mock data so the UI still works
    return res.json({
      provider: "Sample Medical Center",
      dateOfService: new Date().toISOString().slice(0, 10),
      lines: [
        { code: "99213", description: "Office visit, established patient", amountCents: 15000 },
        { code: "85025", description: "Complete blood count (CBC)", amountCents: 4500 },
      ],
    });
  }

  const mime = req.file.mimetype;
  const mediaType = ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(mime)
    ? mime
    : "application/pdf";

  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          {
            type: mediaType === "application/pdf" ? "document" : "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: req.file.buffer.toString("base64"),
            },
          },
          {
            type: "text",
            text: `Extract the billing information from this itemized medical bill. Return ONLY valid JSON in this exact shape:
{
  "provider": "<provider or facility name>",
  "dateOfService": "<YYYY-MM-DD or empty string>",
  "lines": [
    { "code": "<CPT/procedure code or empty>", "description": "<service description>", "amountCents": <integer cents> }
  ]
}
Include only actual line-item charges. Do not include totals, taxes, or payment rows as separate lines.`,
          },
        ],
      }],
    });

    const text = msg.content.find((b) => b.type === "text")?.text || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const parsed = JSON.parse(match[0]);
    res.json(parsed);
  } catch (err) {
    console.error("Extract error:", err.message);
    res.status(500).json(validErr("server_error", "Could not extract charges from this file."));
  }
});

app.listen(PORT, () => console.log(`Meridian Health API running on http://localhost:${PORT}`));
