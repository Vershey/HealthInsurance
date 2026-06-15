/**
 * Single data-access module. All fetch calls live here — never in UI components.
 *
 * When VITE_API_URL is set the real backend is used; otherwise the mock transport
 * runs entirely in-memory so the prototype works without a server.
 */

const BASE = import.meta.env.VITE_API_URL || null;

// ─── helpers ─────────────────────────────────────────────────────────────────

function cents(dollars) {
  return Math.round((parseFloat(dollars) || 0) * 100);
}

function authHeader() {
  // Stub — in a real app this would be a JWT from an auth provider.
  const role = sessionStorage.getItem("mhRole") || "member";
  return { Authorization: `Bearer stub-${role}-token` };
}

async function apiFetch(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json?.error?.message || "Request failed"), { apiError: json?.error });
  return json;
}

// ─── mock transport ──────────────────────────────────────────────────────────

let _mockStore = null;

function getMockStore() {
  if (_mockStore) return _mockStore;
  _mockStore = {
    claims: [
      {
        id: "clm_4471",
        reference: "CLM-2026-4471",
        status: "in_review",
        type: "medical",
        member: { memberId: "MRD-8842013", name: "Jordan Avery", dob: "1989-03-14", groupNumber: "100244" },
        patient: { name: "Jordan Avery", relationship: "self" },
        service: { dateOfService: "2026-05-12", placeOfService: "office", emergency: false, reason: "Annual physical and bloodwork" },
        provider: { name: "Princeton Family Care", npi: "1639271845", address: "12 Nassau St, Princeton NJ" },
        charges: {
          lines: [
            { code: "99396", description: "Preventive visit, established patient", amountCents: 32000 },
            { code: "80053", description: "Comprehensive metabolic panel", amountCents: 12500 },
          ],
          totalBilledCents: 44500,
          balance: "outstanding",
        },
        documents: [{ id: "doc_1", name: "itemized-bill.pdf", type: "itemized_bill", sizeBytes: 184320 }],
        reimbursement: { method: "direct_deposit", accountLast4: "4417" },
        decision: { approvedAmountCents: null, denialReason: null, note: null, adjudicator: null, decidedAt: null },
        events: [
          { at: "2026-05-15T09:12:00Z", type: "submitted", label: "Claim received", by: "member" },
          { at: "2026-05-16T10:40:00Z", type: "in_review", label: "Assigned for review", by: "system" },
        ],
        submittedAt: "2026-05-15T09:12:00Z",
        updatedAt: "2026-05-16T10:40:00Z",
      },
      {
        id: "clm_3920",
        reference: "CLM-2026-3920",
        status: "paid",
        type: "dental",
        member: { memberId: "MRD-8842013", name: "Jordan Avery", dob: "1989-03-14", groupNumber: "100244" },
        patient: { name: "Maya Reyes", relationship: "dependent" },
        service: { dateOfService: "2026-04-02", placeOfService: "office", emergency: false, reason: "Routine cleaning and X-rays" },
        provider: { name: "Bright Smiles Dental", npi: "", address: "45 Elm Ave, Trenton NJ" },
        charges: {
          lines: [{ code: "D1110", description: "Adult prophylaxis", amountCents: 32000 }],
          totalBilledCents: 32000,
          balance: "paid_in_full",
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
        submittedAt: "2026-04-04T08:00:00Z",
        updatedAt: "2026-04-24T10:00:00Z",
      },
      {
        id: "clm_5102",
        reference: "CLM-2026-5102",
        status: "denied",
        type: "vision",
        member: { memberId: "MRD-8842013", name: "Jordan Avery", dob: "1989-03-14", groupNumber: "100244" },
        patient: { name: "Jordan Avery", relationship: "self" },
        service: { dateOfService: "2026-03-10", placeOfService: "office", emergency: false, reason: "Annual eye exam and new frames" },
        provider: { name: "ClearView Optometry", npi: "", address: "88 Commerce Blvd, Edison NJ" },
        charges: {
          lines: [
            { code: "92002", description: "Eye exam, new patient", amountCents: 15000 },
            { code: "V2020", description: "Frames", amountCents: 22000 },
          ],
          totalBilledCents: 37000,
          balance: "paid_in_full",
        },
        documents: [{ id: "doc_3", name: "vision-receipt.pdf", type: "itemized_bill", sizeBytes: 51200 }],
        reimbursement: { method: "check", accountLast4: null },
        decision: { approvedAmountCents: null, denialReason: "not_covered", note: "Frames not covered under current vision plan.", adjudicator: "r.patel", decidedAt: "2026-03-20T11:00:00Z" },
        events: [
          { at: "2026-03-12T07:30:00Z", type: "submitted", label: "Claim received", by: "member" },
          { at: "2026-03-13T09:00:00Z", type: "in_review", label: "Assigned for review", by: "system" },
          { at: "2026-03-20T11:00:00Z", type: "denied", label: "Claim denied", by: "r.patel" },
        ],
        submittedAt: "2026-03-12T07:30:00Z",
        updatedAt: "2026-03-20T11:00:00Z",
      },
      {
        id: "clm_6230",
        reference: "CLM-2026-6230",
        status: "info_needed",
        type: "mental",
        member: { memberId: "MRD-7721099", name: "Sam Torres", dob: "1995-07-22", groupNumber: "100244" },
        patient: { name: "Sam Torres", relationship: "self" },
        service: { dateOfService: "2026-05-28", placeOfService: "telehealth", emergency: false, reason: "Weekly therapy session" },
        provider: { name: "Mindwell Therapy", npi: "9876543210", address: "Telehealth" },
        charges: {
          lines: [{ code: "90837", description: "Psychotherapy, 60 min", amountCents: 20000 }],
          totalBilledCents: 20000,
          balance: "outstanding",
        },
        documents: [],
        reimbursement: { method: "direct_deposit", accountLast4: "8832" },
        decision: { approvedAmountCents: null, denialReason: null, note: "Please attach the provider's superbill.", adjudicator: "a.morgan", decidedAt: null },
        events: [
          { at: "2026-05-29T12:00:00Z", type: "submitted", label: "Claim received", by: "member" },
          { at: "2026-05-30T09:00:00Z", type: "in_review", label: "Assigned for review", by: "system" },
          { at: "2026-06-01T14:00:00Z", type: "info_requested", label: "Additional info requested", by: "a.morgan" },
        ],
        submittedAt: "2026-05-29T12:00:00Z",
        updatedAt: "2026-06-01T14:00:00Z",
      },
      {
        id: "clm_7815",
        reference: "CLM-2026-7815",
        status: "submitted",
        type: "pharmacy",
        member: { memberId: "MRD-7721099", name: "Sam Torres", dob: "1995-07-22", groupNumber: "100244" },
        patient: { name: "Sam Torres", relationship: "self" },
        service: { dateOfService: "2026-06-01", placeOfService: "pharmacy", emergency: false, reason: "Monthly prescription refill — lisinopril 10mg" },
        provider: { name: "CVS Pharmacy #4412", npi: "", address: "200 Main St, New Brunswick NJ" },
        charges: {
          lines: [{ code: "NDC12345", description: "Lisinopril 10mg, 30ct", amountCents: 4800 }],
          totalBilledCents: 4800,
          balance: "paid_in_full",
        },
        documents: [{ id: "doc_5", name: "pharmacy-receipt.jpg", type: "itemized_bill", sizeBytes: 38400 }],
        reimbursement: { method: "direct_deposit", accountLast4: "8832" },
        decision: { approvedAmountCents: null, denialReason: null, note: null, adjudicator: null, decidedAt: null },
        events: [
          { at: "2026-06-02T08:15:00Z", type: "submitted", label: "Claim received", by: "member" },
        ],
        submittedAt: "2026-06-02T08:15:00Z",
        updatedAt: "2026-06-02T08:15:00Z",
      },
    ],
  };
  return _mockStore;
}

function mockListClaims({ role, memberId, status, q } = {}) {
  let claims = getMockStore().claims;
  if (role === "member" && memberId) {
    claims = claims.filter((c) => c.member.memberId === memberId);
  }
  if (status && status.length) {
    const statuses = Array.isArray(status) ? status : [status];
    claims = claims.filter((c) => statuses.includes(c.status));
  }
  if (q) {
    const lq = q.toLowerCase();
    claims = claims.filter((c) =>
      (c.reference + c.provider.name + c.patient.name).toLowerCase().includes(lq)
    );
  }
  return { data: claims, page: 1, pageSize: 50, total: claims.length };
}

function mockGetClaim(id) {
  const claim = getMockStore().claims.find((c) => c.id === id || c.reference === id);
  if (!claim) throw Object.assign(new Error("Claim not found"), { apiError: { code: "not_found" } });
  return claim;
}

function mockSubmitClaim(payload) {
  const store = getMockStore();
  const id = "clm_" + Math.floor(1000 + Math.random() * 8999);
  const reference = "CLM-2026-" + Math.floor(1000 + Math.random() * 8999);
  const now = new Date().toISOString();
  const totalBilledCents = (payload.charges?.lines || []).reduce((s, l) => s + (l.amountCents || 0), 0);
  const claim = {
    id,
    reference,
    status: "submitted",
    type: payload.type,
    member: payload.member,
    patient: payload.patient,
    service: payload.service,
    provider: payload.provider,
    charges: { ...payload.charges, totalBilledCents },
    documents: (payload.documents || []).map((d, i) => ({ ...d, id: `doc_new_${i}` })),
    reimbursement: payload.reimbursement,
    decision: { approvedAmountCents: null, denialReason: null, note: null, adjudicator: null, decidedAt: null },
    events: [{ at: now, type: "submitted", label: "Claim received", by: "member" }],
    submittedAt: now,
    updatedAt: now,
  };
  store.claims.unshift(claim);
  return claim;
}

function mockDecide(id, { action, approvedAmountCents, denialReason, note, adjudicator }) {
  const store = getMockStore();
  const idx = store.claims.findIndex((c) => c.id === id);
  if (idx === -1) throw Object.assign(new Error("Claim not found"), { apiError: { code: "not_found" } });
  const claim = { ...store.claims[idx] };
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
  store.claims[idx] = claim;
  return claim;
}

// ─── public API ──────────────────────────────────────────────────────────────

export function listClaims(params = {}) {
  if (!BASE) return Promise.resolve(mockListClaims(params));
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((x) => qs.append(k, x));
    else if (v != null) qs.set(k, v);
  });
  return apiFetch("GET", `/v1/claims?${qs}`);
}

export function getClaim(id) {
  if (!BASE) return Promise.resolve(mockGetClaim(id));
  return apiFetch("GET", `/v1/claims/${id}`);
}

export function submitClaim(formData) {
  const payload = buildPayload(formData);
  if (!BASE) return Promise.resolve(mockSubmitClaim(payload));
  return apiFetch("POST", "/v1/claims", payload);
}

export function decideClaim(id, decision) {
  if (!BASE) return Promise.resolve(mockDecide(id, decision));
  return apiFetch("POST", `/v1/claims/${id}/decisions`, decision);
}

export async function extractCharges(file) {
  if (!BASE) return mockExtractCharges(file);
  const body = new FormData();
  body.append("bill", file);
  const res = await fetch(`${BASE}/v1/extract-charges`, {
    method: "POST",
    headers: authHeader(),
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || "Extraction failed");
  return json;
}

function mockExtractCharges(_file) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        provider: "Princeton Family Care",
        dateOfService: new Date().toISOString().slice(0, 10),
        lines: [
          { code: "99213", description: "Office visit, established patient", amountCents: 15000 },
          { code: "85025", description: "Complete blood count (CBC)", amountCents: 4500 },
          { code: "81003", description: "Urinalysis, automated", amountCents: 2800 },
        ],
      });
    }, 1800);
  });
}

// ─── payload builder ─────────────────────────────────────────────────────────

function buildPayload(f) {
  return {
    type: f.type,
    member: { memberId: f.memberId, name: f.memberName, dob: f.dob, groupNumber: f.group || "" },
    patient: { name: f.relationship === "self" ? f.memberName : f.patientName, relationship: f.relationship },
    service: { dateOfService: f.dos, placeOfService: f.place, emergency: f.emergency === "yes", reason: f.reason },
    provider: { name: f.provider, npi: f.npi || "", address: f.providerAddr || "" },
    charges: {
      lines: f.services.map((s) => ({
        code: s.code || "",
        description: s.desc,
        amountCents: cents(s.amount),
      })),
      balance: f.paidOOP === "yes" ? "paid_in_full" : "outstanding",
    },
    documents: f.docs.map((d) => ({ name: d.name, type: "itemized_bill", sizeBytes: d.sizeBytes || 0 })),
    reimbursement: {
      method: f.payMethod === "deposit" ? "direct_deposit" : "check",
      ...(f.payMethod === "deposit" && f.account
        ? { accountLast4: f.account.slice(-4) }
        : {}),
    },
  };
}
