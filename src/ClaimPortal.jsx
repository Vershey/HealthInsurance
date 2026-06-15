import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Check, ChevronLeft, ChevronRight, Upload, FileText, X, ShieldCheck,
  Clock, CheckCircle2, AlertCircle, Plus, Trash2, Banknote, Building2,
  User, Stethoscope, Receipt, ArrowRight, Search, CircleDollarSign,
  ClipboardList, LogOut, ThumbsUp, ThumbsDown, MessageSquare, RefreshCw,
} from "lucide-react";
import { submitClaim, listClaims, decideClaim, extractCharges } from "./apiClient.js";
import ReviewExtractedCharges from "./ReviewExtractedCharges.jsx";

/* ----------------------------- theme ----------------------------- */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;450;500;600;700&display=swap');

.cp *{box-sizing:border-box;}
.cp{
  --ink:#16302E; --teal:#0E5F5A; --teal-deep:#0A3D3A; --mint:#12A37D;
  --paper:#F5F8F6; --surface:#FFFFFF; --line:#DCE6E2; --line-soft:#E9F0ED;
  --muted:#5C7370; --amber:#B5742A; --amber-soft:#FBF1E2; --rust:#B4452F;
  --rust-soft:#FBEDE9; --mint-soft:#E4F4EE; --teal-soft:#E2EFEC;
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  color:var(--ink); background:var(--paper);
  min-height:100vh; -webkit-font-smoothing:antialiased; line-height:1.5;
}
.cp .display{font-family:'Fraunces',Georgia,serif; font-weight:500; letter-spacing:-.01em; line-height:1.12;}
.cp .wrap{max-width:980px;margin:0 auto;padding:0 20px;}

/* header */
.cp .topbar{background:var(--teal-deep);color:#EAF3F0;}
.cp .topbar .wrap{display:flex;align-items:center;justify-content:space-between;height:60px;}
.cp .brand{display:flex;align-items:center;gap:10px;font-weight:600;letter-spacing:.01em;}
.cp .brand .logo{width:30px;height:30px;border-radius:9px;background:var(--mint);display:grid;place-items:center;color:var(--teal-deep);}
.cp .tabs{display:flex;gap:4px;background:rgba(255,255,255,.08);padding:4px;border-radius:11px;}
.cp .tab{border:0;background:transparent;color:rgba(234,243,240,.75);font:inherit;font-size:14px;font-weight:500;padding:7px 14px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:7px;}
.cp .tab.on{background:var(--surface);color:var(--teal-deep);}
.cp .tab:not(.on):hover{color:#fff;}
.cp .role-btn{border:1px solid rgba(255,255,255,.2);background:transparent;color:rgba(234,243,240,.75);font:inherit;font-size:12px;font-weight:500;padding:5px 11px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:6px;}
.cp .role-btn:hover{background:rgba(255,255,255,.1);color:#fff;}

/* page intro */
.cp .page{padding:34px 0 64px;}
.cp .eyebrow{font-size:12px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--mint);}
.cp h1.title{font-size:34px;margin:8px 0 6px;}
.cp .lead{color:var(--muted);font-size:15px;max-width:62ch;}

/* stepper rail */
.cp .rail{display:flex;align-items:center;margin:26px 0 24px;gap:0;}
.cp .node{display:flex;align-items:center;flex:0 0 auto;}
.cp .dot{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:600;border:2px solid var(--line);background:var(--surface);color:var(--muted);flex:0 0 auto;transition:.25s;}
.cp .dot.done{background:var(--mint);border-color:var(--mint);color:#fff;}
.cp .dot.cur{border-color:var(--teal);color:var(--teal);box-shadow:0 0 0 4px var(--teal-soft);}
.cp .seg{height:2px;width:100%;background:var(--line);flex:1 1 auto;min-width:14px;}
.cp .seg.fill{background:var(--mint);}
.cp .rail-labels{display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted);margin-bottom:26px;flex-wrap:wrap;gap:4px;}
.cp .rail-labels span{font-weight:500;}
.cp .rail-labels span.cur{color:var(--teal);font-weight:600;}

/* card */
.cp .card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:30px;box-shadow:0 1px 2px rgba(16,48,46,.04);}
.cp .card-head{margin-bottom:22px;}
.cp .card-head h2{font-size:21px;margin:0 0 4px;font-family:'Fraunces',serif;font-weight:500;}
.cp .card-head p{color:var(--muted);font-size:14px;margin:0;}

/* form */
.cp .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
.cp .grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;}
.cp .field{display:flex;flex-direction:column;gap:6px;}
.cp .field.full{grid-column:1/-1;}
.cp label{font-size:13px;font-weight:550;color:var(--ink);}
.cp label .opt{color:var(--muted);font-weight:400;}
.cp input,.cp select,.cp textarea{font:inherit;font-size:14.5px;padding:11px 13px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);width:100%;transition:.15s;}
.cp textarea{resize:vertical;min-height:78px;}
.cp input:focus,.cp select:focus,.cp textarea:focus{outline:none;border-color:var(--teal);box-shadow:0 0 0 3px var(--teal-soft);}
.cp input.err,.cp select.err,.cp textarea.err{border-color:var(--rust);box-shadow:0 0 0 3px var(--rust-soft);}
.cp .errmsg{font-size:12.5px;color:var(--rust);display:flex;align-items:center;gap:5px;}
.cp .hint{font-size:12.5px;color:var(--muted);}

/* choice chips */
.cp .chips{display:flex;flex-wrap:wrap;gap:10px;}
.cp .chip{border:1px solid var(--line);background:var(--surface);border-radius:11px;padding:13px 15px;cursor:pointer;display:flex;align-items:center;gap:11px;font-size:14px;font-weight:500;min-width:150px;flex:1 1 150px;transition:.15s;color:var(--ink);}
.cp .chip:hover{border-color:var(--teal);}
.cp .chip.on{border-color:var(--teal);background:var(--teal-soft);}
.cp .chip .ci{width:34px;height:34px;border-radius:9px;background:var(--paper);display:grid;place-items:center;color:var(--teal);flex:0 0 auto;}
.cp .chip.on .ci{background:var(--teal);color:#fff;}

/* radio cards */
.cp .opt-row{display:flex;gap:14px;flex-wrap:wrap;}
.cp .opt-card{flex:1 1 200px;border:1px solid var(--line);border-radius:12px;padding:16px;cursor:pointer;transition:.15s;}
.cp .opt-card:hover{border-color:var(--teal);}
.cp .opt-card.on{border-color:var(--teal);background:var(--teal-soft);}
.cp .opt-card .ohead{display:flex;align-items:center;gap:10px;font-weight:600;font-size:14.5px;}
.cp .opt-card .odesc{font-size:13px;color:var(--muted);margin-top:6px;}

/* service lines */
.cp .svc{border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:12px;background:var(--paper);}
.cp .svc-grid{display:grid;grid-template-columns:120px 1fr 130px 36px;gap:12px;align-items:end;}
.cp .iconbtn{border:1px solid var(--line);background:var(--surface);border-radius:9px;width:42px;height:42px;display:grid;place-items:center;cursor:pointer;color:var(--muted);}
.cp .iconbtn:hover{border-color:var(--rust);color:var(--rust);}
.cp .addline{border:1px dashed var(--line);background:transparent;border-radius:11px;padding:12px;width:100%;cursor:pointer;color:var(--teal);font:inherit;font-weight:550;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;}
.cp .addline:hover{background:var(--teal-soft);border-color:var(--teal);}
.cp .totrow{display:flex;justify-content:space-between;align-items:center;padding:16px 4px 0;border-top:1px solid var(--line-soft);margin-top:6px;}
.cp .totrow .tt{font-size:14px;color:var(--muted);}
.cp .totrow .tv{font-family:'Fraunces',serif;font-size:24px;font-weight:600;}

/* upload */
.cp .drop{border:1.5px dashed var(--line);border-radius:14px;padding:30px;text-align:center;cursor:pointer;transition:.15s;background:var(--paper);}
.cp .drop:hover{border-color:var(--teal);background:var(--teal-soft);}
.cp .drop .di{width:46px;height:46px;border-radius:12px;background:var(--surface);display:grid;place-items:center;margin:0 auto 12px;color:var(--teal);}
.cp .drop b{font-size:14.5px;}
.cp .drop span{display:block;font-size:13px;color:var(--muted);margin-top:4px;}
.cp .files{margin-top:14px;display:flex;flex-direction:column;gap:8px;}
.cp .filerow{display:flex;align-items:center;gap:12px;border:1px solid var(--line);border-radius:11px;padding:11px 14px;background:var(--surface);}
.cp .filerow .fi{width:34px;height:34px;border-radius:8px;background:var(--mint-soft);display:grid;place-items:center;color:var(--mint);flex:0 0 auto;}
.cp .filerow .fn{font-size:14px;font-weight:500;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.cp .filerow .fs{font-size:12.5px;color:var(--muted);}
.cp .filerow button{border:0;background:transparent;color:var(--muted);cursor:pointer;padding:4px;border-radius:6px;}
.cp .filerow button:hover{color:var(--rust);background:var(--rust-soft);}
.cp .doc-checklist{display:flex;flex-direction:column;gap:9px;margin-top:18px;}
.cp .doc-item{display:flex;align-items:center;gap:10px;font-size:13.5px;color:var(--muted);}
.cp .doc-item .mk{width:18px;height:18px;border-radius:50%;border:1.5px solid var(--line);display:grid;place-items:center;flex:0 0 auto;}
.cp .doc-item.req{color:var(--ink);font-weight:500;}

/* review */
.cp .rev-sec{padding:18px 0;border-bottom:1px solid var(--line-soft);}
.cp .rev-sec:last-of-type{border-bottom:0;}
.cp .rev-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.cp .rev-head h3{font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin:0;}
.cp .rev-edit{border:0;background:transparent;color:var(--teal);font:inherit;font-size:13px;font-weight:600;cursor:pointer;}
.cp .rev-edit:hover{text-decoration:underline;}
.cp .rev-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 28px;}
.cp .rev-item .k{font-size:12.5px;color:var(--muted);}
.cp .rev-item .v{font-size:14.5px;font-weight:500;}
.cp .attest{display:flex;gap:12px;align-items:flex-start;background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:16px;margin-top:18px;}
.cp .attest input{width:18px;height:18px;margin-top:2px;flex:0 0 auto;accent-color:var(--teal);}
.cp .attest label{font-size:13.5px;color:var(--ink);font-weight:400;line-height:1.55;}

/* nav buttons */
.cp .nav{display:flex;justify-content:space-between;align-items:center;margin-top:24px;}
.cp .btn{font:inherit;font-weight:600;font-size:14.5px;padding:12px 22px;border-radius:11px;cursor:pointer;border:1px solid transparent;display:inline-flex;align-items:center;gap:8px;transition:.15s;}
.cp .btn-primary{background:var(--teal);color:#fff;}
.cp .btn-primary:hover{background:var(--teal-deep);}
.cp .btn-primary:disabled{opacity:.5;cursor:not-allowed;}
.cp .btn-ghost{background:transparent;color:var(--ink);border-color:var(--line);}
.cp .btn-ghost:hover{border-color:var(--muted);}
.cp .btn-ghost:disabled{opacity:.4;cursor:not-allowed;}
.cp .btn-danger{background:var(--rust);color:#fff;}
.cp .btn-danger:hover{opacity:.88;}
.cp .btn-amber{background:var(--amber);color:#fff;}
.cp .btn-amber:hover{opacity:.88;}
.cp .btn-sm{font-size:13px;padding:8px 15px;}

/* secure note */
.cp .secure{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--muted);margin-top:16px;justify-content:center;}

/* confirmation */
.cp .conf{text-align:center;padding:46px 30px;}
.cp .conf .seal{width:78px;height:78px;border-radius:50%;background:var(--mint-soft);display:grid;place-items:center;margin:0 auto 20px;color:var(--mint);}
.cp .conf h2{font-family:'Fraunces',serif;font-weight:500;font-size:27px;margin:0 0 8px;}
.cp .conf p{color:var(--muted);max-width:46ch;margin:0 auto;font-size:14.5px;}
.cp .refbox{display:inline-flex;flex-direction:column;align-items:center;gap:2px;background:var(--paper);border:1px solid var(--line);border-radius:13px;padding:16px 30px;margin:24px 0;}
.cp .refbox .rl{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:600;}
.cp .refbox .rv{font-family:'Fraunces',serif;font-size:26px;font-weight:600;letter-spacing:.02em;}
.cp .next-steps{text-align:left;max-width:520px;margin:8px auto 26px;display:flex;flex-direction:column;gap:12px;}
.cp .ns{display:flex;gap:12px;align-items:flex-start;}
.cp .ns .nsn{width:26px;height:26px;border-radius:50%;background:var(--teal-soft);color:var(--teal);display:grid;place-items:center;font-size:13px;font-weight:600;flex:0 0 auto;}
.cp .ns .nst{font-size:13px;font-weight:600;}
.cp .ns .nsd{font-size:13px;color:var(--muted);}
.cp .conf-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}

/* claims list */
.cp .toolbar{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:22px 0 18px;flex-wrap:wrap;}
.cp .searchbox{display:flex;align-items:center;gap:9px;border:1px solid var(--line);border-radius:11px;padding:0 13px;background:var(--surface);flex:1 1 240px;max-width:340px;}
.cp .searchbox input{border:0;padding:11px 0;box-shadow:none;}
.cp .searchbox input:focus{box-shadow:none;}
.cp .filterbtns{display:flex;gap:7px;flex-wrap:wrap;}
.cp .fbtn{border:1px solid var(--line);background:var(--surface);border-radius:9px;padding:8px 13px;font:inherit;font-size:13px;font-weight:500;cursor:pointer;color:var(--muted);}
.cp .fbtn.on{background:var(--ink);color:#fff;border-color:var(--ink);}
.cp .claim{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px 20px;margin-bottom:12px;cursor:pointer;transition:.15s;}
.cp .claim:hover{border-color:var(--teal);box-shadow:0 3px 10px rgba(16,48,46,.06);}
.cp .claim-top{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;}
.cp .claim-id{font-family:'Fraunces',serif;font-weight:600;font-size:17px;}
.cp .claim-meta{font-size:13px;color:var(--muted);margin-top:3px;}
.cp .claim-amt{text-align:right;}
.cp .claim-amt .a{font-family:'Fraunces',serif;font-weight:600;font-size:18px;}
.cp .claim-amt .al{font-size:12px;color:var(--muted);}
.cp .badge{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;padding:5px 11px;border-radius:999px;}
.cp .badge .bd{width:7px;height:7px;border-radius:50%;}

/* timeline */
.cp .tl{margin-top:18px;padding-top:18px;border-top:1px solid var(--line-soft);display:flex;justify-content:space-between;position:relative;}
.cp .tl-step{display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;text-align:center;position:relative;z-index:1;}
.cp .tl-node{width:28px;height:28px;border-radius:50%;border:2px solid var(--line);background:var(--surface);display:grid;place-items:center;color:var(--muted);}
.cp .tl-node.done{background:var(--mint);border-color:var(--mint);color:#fff;}
.cp .tl-node.cur{border-color:var(--teal);color:var(--teal);box-shadow:0 0 0 4px var(--teal-soft);}
.cp .tl-node.bad{background:var(--rust);border-color:var(--rust);color:#fff;}
.cp .tl-lbl{font-size:11.5px;font-weight:600;}
.cp .tl-date{font-size:11px;color:var(--muted);}
.cp .tl-line{position:absolute;top:31px;left:14%;right:14%;height:2px;background:var(--line);z-index:0;}
.cp .empty{text-align:center;padding:54px 20px;color:var(--muted);}
.cp .empty .ei{width:54px;height:54px;border-radius:14px;background:var(--surface);border:1px solid var(--line);display:grid;place-items:center;margin:0 auto 14px;color:var(--teal);}

/* loading / error */
.cp .loading{text-align:center;padding:54px 20px;color:var(--muted);font-size:14px;}
.cp .apierr{background:var(--rust-soft);border:1px solid var(--rust);border-radius:12px;padding:14px 18px;font-size:13.5px;color:var(--rust);margin-bottom:16px;display:flex;align-items:center;gap:9px;}

/* adjudicator */
.cp .adj-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px;}
.cp .stat-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px 20px;}
.cp .stat-card .sv{font-family:'Fraunces',serif;font-size:28px;font-weight:600;}
.cp .stat-card .sl{font-size:13px;color:var(--muted);margin-top:2px;}
.cp .action-panel{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:22px;margin-top:20px;}
.cp .action-panel h3{font-size:14px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin:0 0 16px;}
.cp .action-tabs{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;}
.cp .action-tab{border:1px solid var(--line);background:var(--surface);border-radius:9px;padding:9px 16px;font:inherit;font-size:13.5px;font-weight:500;cursor:pointer;color:var(--muted);display:flex;align-items:center;gap:7px;}
.cp .action-tab:hover{border-color:var(--teal);}
.cp .action-tab.on.approve{border-color:var(--mint);background:var(--mint-soft);color:var(--teal-deep);}
.cp .action-tab.on.deny{border-color:var(--rust);background:var(--rust-soft);color:var(--rust);}
.cp .action-tab.on.info{border-color:var(--amber);background:var(--amber-soft);color:var(--amber);}
.cp .event-log{margin-top:18px;display:flex;flex-direction:column;gap:10px;}
.cp .ev{display:flex;gap:12px;align-items:flex-start;}
.cp .ev-dot{width:9px;height:9px;border-radius:50%;background:var(--mint);flex:0 0 auto;margin-top:5px;}
.cp .ev-dot.denied{background:var(--rust);}
.cp .ev-dot.info{background:var(--amber);}
.cp .ev-at{font-size:12px;color:var(--muted);}
.cp .ev-lbl{font-size:13.5px;font-weight:500;}
.cp .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 28px;margin-top:12px;}
.cp .di-item .dk{font-size:12px;color:var(--muted);}
.cp .di-item .dv{font-size:14px;font-weight:500;}
.cp .claim-detail{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:22px;margin-bottom:14px;}
.cp .claim-detail h3{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:0 0 12px;}

@media(max-width:720px){
  .cp .grid,.cp .grid-3,.cp .rev-grid,.cp .detail-grid{grid-template-columns:1fr;}
  .cp .svc-grid{grid-template-columns:1fr 1fr;}
  .cp h1.title{font-size:27px;}
  .cp .rail-labels{display:none;}
  .cp .card{padding:20px;}
  .cp .adj-stats{grid-template-columns:1fr 1fr;}
}
`;

/* --------------------------- constants ---------------------------- */
const STEPS = ["Member", "Claim", "Provider", "Documents", "Payment", "Review"];
const CLAIM_TYPES = [
  { id: "medical", label: "Medical", icon: Stethoscope },
  { id: "dental", label: "Dental", icon: User },
  { id: "vision", label: "Vision", icon: User },
  { id: "pharmacy", label: "Pharmacy", icon: Receipt },
  { id: "mental", label: "Mental health", icon: User },
];
const STATUS = {
  submitted:   { label: "Submitted",     color: "var(--teal)",  soft: "var(--teal-soft)"  },
  in_review:   { label: "In review",     color: "var(--amber)", soft: "var(--amber-soft)" },
  info_needed: { label: "Action needed", color: "var(--rust)",  soft: "var(--rust-soft)"  },
  approved:    { label: "Approved",      color: "var(--mint)",  soft: "var(--mint-soft)"  },
  paid:        { label: "Paid",          color: "var(--mint)",  soft: "var(--mint-soft)"  },
  denied:      { label: "Denied",        color: "var(--rust)",  soft: "var(--rust-soft)"  },
};
const money = (n) => "$" + Number((n || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => d ? new Date(d.includes("T") ? d : d + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

/* ============================== APP =============================== */
export default function ClaimPortal() {
  const [role, setRole] = useState(() => sessionStorage.getItem("mhRole") || "member");
  const [view, setView] = useState("submit");
  const [step, setStep] = useState(0);
  const [lastClaim, setLastClaim] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef(null);

  const blank = {
    memberId: "", memberName: "", dob: "", group: "", relationship: "self", patientName: "",
    type: "", dos: "", place: "office", emergency: "no", reason: "",
    provider: "", npi: "", providerAddr: "", paidOOP: "no",
    services: [{ id: 1, code: "", desc: "", amount: "" }],
    docs: [],
    payMethod: "deposit", routing: "", account: "",
    attest: false,
  };
  const [form, setForm] = useState(blank);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const total = useMemo(
    () => form.services.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0),
    [form.services]
  );

  function switchRole(r) {
    sessionStorage.setItem("mhRole", r);
    setRole(r);
    setView(r === "adjudicator" ? "queue" : "submit");
    setStep(0);
    setErrors({});
    setForm(blank);
  }

  function validate(s) {
    const e = {};
    if (s === 0) {
      if (!form.memberId.trim()) e.memberId = "Enter your member ID (on your insurance card).";
      if (!form.memberName.trim()) e.memberName = "Enter the policyholder's name.";
      if (!form.dob) e.dob = "Date of birth is required.";
      else if (form.dob > today()) e.dob = "Date of birth can't be in the future.";
      if (form.relationship !== "self" && !form.patientName.trim()) e.patientName = "Enter the patient's name.";
    }
    if (s === 1) {
      if (!form.type) e.type = "Choose what kind of care this claim is for.";
      if (!form.dos) e.dos = "Enter the date you received care.";
      else if (form.dos > today()) e.dos = "The service date can't be in the future.";
      if (!form.reason.trim()) e.reason = "Briefly describe the reason for the visit.";
    }
    if (s === 2) {
      if (!form.provider.trim()) e.provider = "Enter the name of the provider or facility.";
      const bad = form.services.some((x) => !x.desc.trim() || !(parseFloat(x.amount) > 0));
      if (bad) e.services = "Each line needs a description and an amount greater than $0.";
    }
    if (s === 3) {
      if (form.docs.length === 0) e.docs = "Attach at least your itemized bill so we can process the claim.";
    }
    if (s === 4) {
      if (form.payMethod === "deposit") {
        if (!/^\d{9}$/.test(form.routing)) e.routing = "Routing number must be 9 digits.";
        if (!/^\d{4,17}$/.test(form.account)) e.account = "Enter a valid account number.";
      }
    }
    if (s === 5) {
      if (!form.attest) e.attest = "Please confirm the information is accurate before submitting.";
    }
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else doSubmit();
  }
  function back() { setErrors({}); if (step > 0) setStep(step - 1); }

  async function doSubmit() {
    setSubmitting(true);
    try {
      const claim = await submitClaim(form);
      setLastClaim(claim);
      setView("confirm");
    } catch (err) {
      setErrors({ _api: err.message || "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() { setForm(blank); setStep(0); setErrors({}); setView("submit"); }

  function addFiles(list) {
    const items = Array.from(list).map((f, i) => ({
      id: Date.now() + i, name: f.name, sizeBytes: f.size,
      size: f.size > 1e6 ? (f.size / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(f.size / 1024)) + " KB",
    }));
    set("docs", [...form.docs, ...items]);
  }

  const isAdj = role === "adjudicator";

  return (
    <div className="cp">
      <style>{CSS}</style>

      <header className="topbar">
        <div className="wrap">
          <div className="brand">
            <span className="logo"><ShieldCheck size={18} /></span>
            Meridian Health · {isAdj ? "Adjudicator Console" : "Member Portal"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {!isAdj && (
              <nav className="tabs">
                <button className={"tab" + (view === "submit" || view === "confirm" ? " on" : "")} onClick={() => setView("submit")}>
                  <Plus size={15} /> Submit a claim
                </button>
                <button className={"tab" + (view === "claims" ? " on" : "")} onClick={() => setView("claims")}>
                  <FileText size={15} /> My claims
                </button>
              </nav>
            )}
            {isAdj && (
              <nav className="tabs">
                <button className={"tab" + (view === "queue" ? " on" : "")} onClick={() => setView("queue")}>
                  <ClipboardList size={15} /> Review queue
                </button>
              </nav>
            )}
            <button className="role-btn" onClick={() => switchRole(isAdj ? "member" : "adjudicator")}>
              <LogOut size={13} /> {isAdj ? "Switch to member" : "Switch to adjudicator"}
            </button>
          </div>
        </div>
      </header>

      <main className="wrap page">
        {isAdj && <AdjudicatorQueue />}

        {!isAdj && view === "confirm" && lastClaim && (
          <Confirmation claim={lastClaim} onTrack={() => setView("claims")} onAgain={reset} />
        )}

        {!isAdj && view === "claims" && (
          <ClaimsView memberId={form.memberId || "MRD-8842013"} onNew={reset} />
        )}

        {!isAdj && view === "submit" && (
          <>
            <div className="eyebrow">Reimbursement claim</div>
            <h1 className="title display">Submit a health claim</h1>
            <p className="lead">For care you paid for out of network or out of pocket. It takes about five minutes — have your insurance card and an itemized bill ready.</p>

            <Stepper step={step} />

            <div className="card">
              {errors._api && (
                <div className="apierr"><AlertCircle size={16} /> {errors._api}</div>
              )}
              {step === 0 && <StepMember form={form} set={set} errors={errors} />}
              {step === 1 && <StepClaim form={form} set={set} errors={errors} />}
              {step === 2 && <StepProvider form={form} set={set} errors={errors} total={total} />}
              {step === 3 && <StepDocs form={form} set={set} errors={errors} fileInput={fileInput} addFiles={addFiles} />}
              {step === 4 && <StepPayment form={form} set={set} errors={errors} />}
              {step === 5 && <StepReview form={form} total={total} errors={errors} set={set} goTo={setStep} />}

              <div className="nav">
                <button className="btn btn-ghost" onClick={back} disabled={step === 0 || submitting}>
                  <ChevronLeft size={17} /> Back
                </button>
                <button className="btn btn-primary" onClick={next} disabled={submitting}>
                  {submitting ? "Submitting…" : step === STEPS.length - 1
                    ? <><Check size={17} /> Submit claim</>
                    : <>Continue <ChevronRight size={17} /></>}
                </button>
              </div>
            </div>

            <div className="secure"><ShieldCheck size={14} /> Your information is encrypted and used only to process this claim.</div>
          </>
        )}
      </main>
    </div>
  );
}

/* --------------------------- stepper ------------------------------ */
function Stepper({ step }) {
  return (
    <>
      <div className="rail">
        {STEPS.map((_, i) => (
          <React.Fragment key={i}>
            <div className="node">
              <div className={"dot" + (i < step ? " done" : i === step ? " cur" : "")}>
                {i < step ? <Check size={15} /> : i + 1}
              </div>
            </div>
            {i < STEPS.length - 1 && <div className={"seg" + (i < step ? " fill" : "")} />}
          </React.Fragment>
        ))}
      </div>
      <div className="rail-labels">
        {STEPS.map((s, i) => <span key={s} className={i === step ? "cur" : ""}>{s}</span>)}
      </div>
    </>
  );
}

/* small helpers */
const Field = ({ label, opt, error, children }) => (
  <div className={"field" + (label === "__full" ? " full" : "")}>
    {label && label !== "__full" && <label>{label} {opt && <span className="opt">({opt})</span>}</label>}
    {children}
    {error && <span className="errmsg"><AlertCircle size={13} /> {error}</span>}
  </div>
);
const cls = (e) => "" + (e ? " err" : "");

/* ------------------------- step 1: member ------------------------- */
function StepMember({ form, set, errors }) {
  return (
    <>
      <div className="card-head"><h2>Who is this claim for?</h2><p>Match these details to the insurance card exactly.</p></div>
      <div className="grid">
        <Field label="Member ID" error={errors.memberId}>
          <input className={cls(errors.memberId)} value={form.memberId} onChange={(e) => set("memberId", e.target.value)} placeholder="e.g. MRD-8842013" />
        </Field>
        <Field label="Group number" opt="optional">
          <input value={form.group} onChange={(e) => set("group", e.target.value)} placeholder="e.g. 100244" />
        </Field>
        <Field label="Policyholder name" error={errors.memberName}>
          <input className={cls(errors.memberName)} value={form.memberName} onChange={(e) => set("memberName", e.target.value)} placeholder="Full name on the policy" />
        </Field>
        <Field label="Date of birth" error={errors.dob}>
          <input type="date" max={today()} className={cls(errors.dob)} value={form.dob} onChange={(e) => set("dob", e.target.value)} />
        </Field>
        <Field label="Patient relationship to policyholder">
          <select value={form.relationship} onChange={(e) => set("relationship", e.target.value)}>
            <option value="self">Self</option>
            <option value="spouse">Spouse / partner</option>
            <option value="dependent">Dependent</option>
          </select>
        </Field>
        {form.relationship !== "self" && (
          <Field label="Patient name" error={errors.patientName}>
            <input className={cls(errors.patientName)} value={form.patientName} onChange={(e) => set("patientName", e.target.value)} placeholder="Who received care" />
          </Field>
        )}
      </div>
    </>
  );
}

/* ------------------------- step 2: claim -------------------------- */
function StepClaim({ form, set, errors }) {
  return (
    <>
      <div className="card-head"><h2>About the care</h2><p>Tell us what kind of care this was and when it happened.</p></div>
      <Field label="Type of care" error={errors.type}>
        <div className="chips">
          {CLAIM_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.id} className={"chip" + (form.type === t.id ? " on" : "")} onClick={() => set("type", t.id)} role="button" tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && set("type", t.id)}>
                <span className="ci"><Icon size={17} /></span> {t.label}
              </div>
            );
          })}
        </div>
      </Field>
      <div className="grid" style={{ marginTop: 18 }}>
        <Field label="Date of service" error={errors.dos}>
          <input type="date" max={today()} className={cls(errors.dos)} value={form.dos} onChange={(e) => set("dos", e.target.value)} />
        </Field>
        <Field label="Place of service">
          <select value={form.place} onChange={(e) => set("place", e.target.value)}>
            <option value="office">Doctor's office</option>
            <option value="hospital">Hospital</option>
            <option value="urgent">Urgent care</option>
            <option value="telehealth">Telehealth</option>
            <option value="lab">Lab / imaging</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Was this emergency care?">
          <select value={form.emergency} onChange={(e) => set("emergency", e.target.value)}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
        <div className="field full">
          <label>Reason for the visit</label>
          <textarea className={cls(errors.reason)} value={form.reason} onChange={(e) => set("reason", e.target.value)} placeholder="e.g. Annual physical exam and routine bloodwork" />
          {errors.reason && <span className="errmsg"><AlertCircle size={13} /> {errors.reason}</span>}
          <span className="hint">A short description is fine — you don't need diagnosis codes.</span>
        </div>
      </div>
    </>
  );
}

/* ------------------------ step 3: provider ------------------------ */
function StepProvider({ form, set, errors, total }) {
  const upd = (id, k, v) => set("services", form.services.map((s) => s.id === id ? { ...s, [k]: v } : s));
  const add = () => set("services", [...form.services, { id: Date.now(), code: "", desc: "", amount: "" }]);
  const remove = (id) => set("services", form.services.filter((s) => s.id !== id));

  function applyExtracted({ provider, dateOfService, lines }) {
    if (provider) set("provider", provider);
    if (dateOfService) set("dos", dateOfService);
    if (lines?.length) {
      set("services", lines.map((l, i) => ({
        id: Date.now() + i,
        code: l.code || "",
        desc: l.description || "",
        amount: l.amountCents != null ? (l.amountCents / 100).toFixed(2) : "",
      })));
    }
  }

  return (
    <>
      <div className="card-head"><h2>Provider & charges</h2><p>Copy the charges from your itemized bill, one line per service.</p></div>

      <ReviewExtractedCharges extract={extractCharges} onApply={applyExtracted} />
      <div className="grid">
        <Field label="Provider or facility name" error={errors.provider}>
          <input className={cls(errors.provider)} value={form.provider} onChange={(e) => set("provider", e.target.value)} placeholder="e.g. Dr. Lena Okafor / City Health Clinic" />
        </Field>
        <Field label="Provider NPI" opt="optional">
          <input value={form.npi} onChange={(e) => set("npi", e.target.value)} placeholder="10-digit number, if you have it" />
        </Field>
        <div className="field full">
          <label>Provider address <span className="opt">(optional)</span></label>
          <input value={form.providerAddr} onChange={(e) => set("providerAddr", e.target.value)} placeholder="Street, city, state" />
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <label style={{ display: "block", marginBottom: 10 }}>Itemized services</label>
        {form.services.map((s, i) => (
          <div className="svc" key={s.id}>
            <div className="svc-grid">
              <div className="field">
                {i === 0 && <label style={{ fontSize: 12 }}>Code <span className="opt">(opt)</span></label>}
                <input value={s.code} onChange={(e) => upd(s.id, "code", e.target.value)} placeholder="CPT" />
              </div>
              <div className="field">
                {i === 0 && <label style={{ fontSize: 12 }}>Service description</label>}
                <input value={s.desc} onChange={(e) => upd(s.id, "desc", e.target.value)} placeholder="e.g. Office visit, established patient" />
              </div>
              <div className="field">
                {i === 0 && <label style={{ fontSize: 12 }}>Amount billed</label>}
                <input inputMode="decimal" value={s.amount} onChange={(e) => upd(s.id, "amount", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.00" />
              </div>
              <button className="iconbtn" onClick={() => form.services.length > 1 && remove(s.id)} title="Remove line" disabled={form.services.length === 1}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        <button className="addline" onClick={add}><Plus size={16} /> Add another service</button>
        {errors.services && <span className="errmsg" style={{ marginTop: 8 }}><AlertCircle size={13} /> {errors.services}</span>}

        <div className="totrow">
          <span className="tt">Total amount claimed</span>
          <span className="tv">${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="opt-row" style={{ marginTop: 20 }}>
        {[["yes", "I already paid this in full"], ["no", "I still owe a balance"]].map(([v, l]) => (
          <div key={v} className={"opt-card" + (form.paidOOP === v ? " on" : "")} onClick={() => set("paidOOP", v)} role="button" tabIndex={0}>
            <div className="ohead"><CircleDollarSign size={17} /> {l}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------ step 4: documents ----------------------- */
function StepDocs({ form, set, errors, fileInput, addFiles }) {
  const checklist = [
    { label: "Itemized bill or superbill", req: true },
    { label: "Proof of payment / receipt", req: false },
    { label: "Explanation of Benefits (EOB), if any", req: false },
    { label: "Prescription or referral, if applicable", req: false },
  ];
  return (
    <>
      <div className="card-head"><h2>Attach your documents</h2><p>Clear photos or PDFs work. The itemized bill is required; the rest help avoid follow-up requests.</p></div>

      <div className="drop" onClick={() => fileInput.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
        <div className="di"><Upload size={20} /></div>
        <b>Drop files here, or click to browse</b>
        <span>PDF, JPG or PNG · up to 10 MB each</span>
        <input ref={fileInput} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      </div>

      {form.docs.length > 0 && (
        <div className="files">
          {form.docs.map((d) => (
            <div className="filerow" key={d.id}>
              <span className="fi"><FileText size={16} /></span>
              <span className="fn">{d.name}</span>
              <span className="fs">{d.size}</span>
              <button onClick={() => set("docs", form.docs.filter((x) => x.id !== d.id))} title="Remove"><X size={16} /></button>
            </div>
          ))}
        </div>
      )}
      {errors.docs && <span className="errmsg" style={{ marginTop: 12 }}><AlertCircle size={13} /> {errors.docs}</span>}

      <div className="doc-checklist">
        {checklist.map((c) => (
          <div key={c.label} className={"doc-item" + (c.req ? " req" : "")}>
            <span className="mk" style={c.req && form.docs.length ? { background: "var(--mint)", borderColor: "var(--mint)" } : {}}>
              {c.req && form.docs.length ? <Check size={11} color="#fff" /> : null}
            </span>
            {c.label}{c.req && " — required"}
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------ step 5: payment ------------------------- */
function StepPayment({ form, set, errors }) {
  return (
    <>
      <div className="card-head"><h2>Where should we send your reimbursement?</h2><p>If your claim is approved, this is how you'll be paid.</p></div>
      <div className="opt-row">
        <div className={"opt-card" + (form.payMethod === "deposit" ? " on" : "")} onClick={() => set("payMethod", "deposit")} role="button" tabIndex={0}>
          <div className="ohead"><Banknote size={18} /> Direct deposit</div>
          <div className="odesc">Fastest — usually 3–5 business days after approval.</div>
        </div>
        <div className={"opt-card" + (form.payMethod === "check" ? " on" : "")} onClick={() => set("payMethod", "check")} role="button" tabIndex={0}>
          <div className="ohead"><Building2 size={18} /> Mailed check</div>
          <div className="odesc">Sent to your address on file — allow 7–10 business days.</div>
        </div>
      </div>

      {form.payMethod === "deposit" && (
        <div className="grid" style={{ marginTop: 20 }}>
          <Field label="Routing number" error={errors.routing}>
            <input inputMode="numeric" maxLength={9} className={cls(errors.routing)} value={form.routing}
              onChange={(e) => set("routing", e.target.value.replace(/\D/g, ""))} placeholder="9 digits" />
          </Field>
          <Field label="Account number" error={errors.account}>
            <input inputMode="numeric" maxLength={17} className={cls(errors.account)} value={form.account}
              onChange={(e) => set("account", e.target.value.replace(/\D/g, ""))} placeholder="Checking or savings" />
          </Field>
        </div>
      )}
      <div className="secure" style={{ justifyContent: "flex-start", marginTop: 16 }}>
        <ShieldCheck size={14} /> Bank details are encrypted and never shown to providers.
      </div>
    </>
  );
}

/* ------------------------ step 6: review -------------------------- */
function StepReview({ form, total, errors, set, goTo }) {
  const typeLabel = CLAIM_TYPES.find((t) => t.id === form.type)?.label || "—";
  const mask = (s) => s ? "••••" + s.slice(-4) : "—";
  const Item = ({ k, v }) => <div className="rev-item"><div className="k">{k}</div><div className="v">{v || "—"}</div></div>;
  const Sec = ({ title, to, children }) => (
    <div className="rev-sec">
      <div className="rev-head"><h3>{title}</h3><button className="rev-edit" onClick={() => goTo(to)}>Edit</button></div>
      <div className="rev-grid">{children}</div>
    </div>
  );
  return (
    <>
      <div className="card-head"><h2>Review and submit</h2><p>Check everything carefully — accurate details mean faster processing.</p></div>

      <Sec title="Member" to={0}>
        <Item k="Member ID" v={form.memberId} />
        <Item k="Policyholder" v={form.memberName} />
        <Item k="Patient" v={form.relationship === "self" ? "Self" : `${form.patientName} (${form.relationship})`} />
        <Item k="Date of birth" v={fmtDate(form.dob)} />
      </Sec>
      <Sec title="Care" to={1}>
        <Item k="Type" v={typeLabel} />
        <Item k="Date of service" v={fmtDate(form.dos)} />
        <Item k="Place of service" v={form.place} />
        <Item k="Reason" v={form.reason} />
      </Sec>
      <Sec title="Provider & charges" to={2}>
        <Item k="Provider" v={form.provider} />
        <Item k="Services" v={`${form.services.length} line${form.services.length > 1 ? "s" : ""}`} />
        <Item k="Total claimed" v={"$" + total.toLocaleString("en-US", { minimumFractionDigits: 2 })} />
        <Item k="Balance" v={form.paidOOP === "yes" ? "Paid in full" : "Outstanding"} />
      </Sec>
      <Sec title="Documents" to={3}>
        <Item k="Attached" v={`${form.docs.length} file${form.docs.length !== 1 ? "s" : ""}`} />
        <Item k="Files" v={form.docs.map((d) => d.name).join(", ")} />
      </Sec>
      <Sec title="Reimbursement" to={4}>
        <Item k="Method" v={form.payMethod === "deposit" ? "Direct deposit" : "Mailed check"} />
        {form.payMethod === "deposit" && <Item k="Account" v={mask(form.account)} />}
      </Sec>

      <div className="attest">
        <input type="checkbox" id="att" checked={form.attest} onChange={(e) => set("attest", e.target.checked)} />
        <label htmlFor="att">I confirm the information above is true and complete to the best of my knowledge, and that these expenses were for the patient named. I understand that submitting false information may result in denial of the claim.</label>
      </div>
      {errors.attest && <span className="errmsg" style={{ marginTop: 10 }}><AlertCircle size={13} /> {errors.attest}</span>}
    </>
  );
}

/* ------------------------ confirmation ---------------------------- */
function Confirmation({ claim, onTrack, onAgain }) {
  const steps = [
    { t: "Review (1–2 business days)", d: "We check that your claim has everything needed." },
    { t: "Processing (5–10 business days)", d: "We compare charges against your plan benefits." },
    { t: "Decision & payment", d: "You'll get an Explanation of Benefits, then your reimbursement." },
  ];
  return (
    <div className="card">
      <div className="conf">
        <div className="seal"><CheckCircle2 size={38} /></div>
        <h2>Your claim is on its way</h2>
        <p>We've received everything and started reviewing. Keep your reference number — you can track progress anytime under My claims.</p>
        <div className="refbox"><span className="rl">Reference number</span><span className="rv">{claim.reference}</span></div>
        <div className="next-steps">
          {steps.map((s, i) => (
            <div className="ns" key={i}>
              <span className="nsn">{i + 1}</span>
              <div><div className="nst">{s.t}</div><div className="nsd">{s.d}</div></div>
            </div>
          ))}
        </div>
        <div className="conf-actions">
          <button className="btn btn-primary" onClick={onTrack}>Track this claim <ArrowRight size={16} /></button>
          <button className="btn btn-ghost" onClick={onAgain}>Submit another claim</button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- claims view -------------------------- */
function ClaimsView({ memberId, onNew }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiErr, setApiErr] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setApiErr(null);
    try {
      const res = await listClaims({ role: "member", memberId });
      setClaims(res.data || []);
    } catch (err) {
      setApiErr(err.message);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => { load(); }, [load]);

  const filtered = claims.filter((c) => {
    const matchQ = (c.reference + c.provider.name + c.patient.name).toLowerCase().includes(q.toLowerCase());
    const active = ["submitted", "in_review", "info_needed"].includes(c.status);
    const matchF = filter === "all" || (filter === "active" && active) || (filter === "closed" && !active);
    return matchQ && matchF;
  });

  return (
    <>
      <div className="eyebrow">Claims tracking</div>
      <h1 className="title display">My claims</h1>
      <p className="lead">Everything you've submitted, with live status. Tap a claim to see where it is.</p>

      <div className="toolbar">
        <div className="searchbox">
          <Search size={16} color="var(--muted)" />
          <input placeholder="Search by reference, provider or patient" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="filterbtns">
            {[["all", "All"], ["active", "In progress"], ["closed", "Closed"]].map(([v, l]) => (
              <button key={v} className={"fbtn" + (filter === v ? " on" : "")} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={load} title="Refresh"><RefreshCw size={14} /></button>
        </div>
      </div>

      {apiErr && <div className="apierr"><AlertCircle size={16} /> {apiErr}</div>}

      {loading ? (
        <div className="loading">Loading claims…</div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="ei"><FileText size={22} /></div>
          <p>No claims match that view yet.</p>
          <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={onNew}><Plus size={16} /> Submit a claim</button>
        </div>
      ) : filtered.map((c) => {
        const st = STATUS[c.status] || STATUS.submitted;
        const typeLabel = CLAIM_TYPES.find((t) => t.id === c.type)?.label || c.type;
        const approvedAmt = c.decision?.approvedAmountCents;
        return (
          <div className="claim" key={c.id} onClick={() => setOpen(open === c.id ? null : c.id)}>
            <div className="claim-top">
              <div>
                <div className="claim-id">{c.reference}</div>
                <div className="claim-meta">{typeLabel} · {c.provider.name} · {c.patient.name}</div>
                <div className="claim-meta">Service {fmtDate(c.service.dateOfService)} · Submitted {fmtDate(c.submittedAt)}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <span className="badge" style={{ background: st.soft, color: st.color }}>
                  <span className="bd" style={{ background: st.color }} /> {st.label}
                </span>
                <div className="claim-amt">
                  <div className="a">{money(c.charges.totalBilledCents)}</div>
                  <div className="al">{c.status === "paid" && approvedAmt ? `Reimbursed ${money(approvedAmt)}` : "Claimed"}</div>
                </div>
              </div>
            </div>
            {open === c.id && <Timeline c={c} />}
          </div>
        );
      })}
    </>
  );
}

function Timeline({ c }) {
  const denied = c.status === "denied";
  const reached = { submitted: 1, in_review: 1, info_needed: 1, approved: 2, paid: 3, denied: 2 }[c.status] ?? 1;
  const evDate = (type) => {
    const ev = c.events?.find((e) => e.type === type);
    return ev ? fmtDate(ev.at) : "";
  };
  const stages = [
    { lbl: "Received", date: fmtDate(c.submittedAt) },
    { lbl: "In review", date: c.status === "submitted" ? "" : "In progress" },
    { lbl: denied ? "Denied" : "Decision", date: c.decision?.decidedAt ? fmtDate(c.decision.decidedAt) : "" },
    { lbl: "Payment", date: evDate("paid") },
  ];
  return (
    <div className="tl" onClick={(e) => e.stopPropagation()}>
      <div className="tl-line" />
      {stages.map((s, i) => {
        const done = i < reached;
        const cur = i === reached && !denied;
        const bad = denied && i === 2;
        return (
          <div className="tl-step" key={i}>
            <div className={"tl-node" + (bad ? " bad" : done ? " done" : cur ? " cur" : "")}>
              {bad ? <X size={14} /> : done ? <Check size={14} /> : cur ? <Clock size={13} /> : i + 1}
            </div>
            <div className="tl-lbl">{s.lbl}</div>
            <div className="tl-date">{s.date}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ====================== ADJUDICATOR CONSOLE ======================= */
function AdjudicatorQueue() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiErr, setApiErr] = useState(null);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setApiErr(null);
    try {
      const res = await listClaims({ role: "adjudicator" });
      setClaims(res.data || []);
    } catch (err) {
      setApiErr(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = {
    submitted:   claims.filter((c) => c.status === "submitted").length,
    in_review:   claims.filter((c) => c.status === "in_review").length,
    info_needed: claims.filter((c) => c.status === "info_needed").length,
  };

  const filtered = claims.filter((c) => {
    const matchQ = (c.reference + c.provider.name + c.patient.name + c.member.name).toLowerCase().includes(q.toLowerCase());
    const matchF = filter === "all" || c.status === filter;
    return matchQ && matchF;
  });

  const onDecided = (updated) => {
    setClaims((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    setSelected(updated);
  };

  if (selected) {
    return <ClaimDetail claim={selected} onBack={() => setSelected(null)} onDecided={onDecided} />;
  }

  return (
    <>
      <div className="eyebrow">Adjudicator console</div>
      <h1 className="title display">Review queue</h1>
      <p className="lead">Claims awaiting action. Open a claim to approve, deny, or request additional information.</p>

      <div className="adj-stats">
        {[
          { label: "Submitted", value: counts.submitted, color: "var(--teal)" },
          { label: "In review", value: counts.in_review, color: "var(--amber)" },
          { label: "Action needed", value: counts.info_needed, color: "var(--rust)" },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="sv" style={{ color: s.color }}>{s.value}</div>
            <div className="sl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="searchbox">
          <Search size={16} color="var(--muted)" />
          <input placeholder="Search by reference, provider or member" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="filterbtns">
            {[["all","All"],["submitted","Submitted"],["in_review","In review"],["info_needed","Action needed"],["approved","Approved"],["denied","Denied"],["paid","Paid"]].map(([v, l]) => (
              <button key={v} className={"fbtn" + (filter === v ? " on" : "")} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14} /></button>
        </div>
      </div>

      {apiErr && <div className="apierr"><AlertCircle size={16} /> {apiErr}</div>}

      {loading ? (
        <div className="loading">Loading queue…</div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="ei"><ClipboardList size={22} /></div>
          <p>No claims match that filter.</p>
        </div>
      ) : filtered.map((c) => {
        const st = STATUS[c.status] || STATUS.submitted;
        const typeLabel = CLAIM_TYPES.find((t) => t.id === c.type)?.label || c.type;
        return (
          <div className="claim" key={c.id} onClick={() => setSelected(c)}>
            <div className="claim-top">
              <div>
                <div className="claim-id">{c.reference}</div>
                <div className="claim-meta">{typeLabel} · {c.provider.name}</div>
                <div className="claim-meta">Member: {c.member.name} · Patient: {c.patient.name}</div>
                <div className="claim-meta">Service {fmtDate(c.service.dateOfService)} · Submitted {fmtDate(c.submittedAt)}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <span className="badge" style={{ background: st.soft, color: st.color }}>
                  <span className="bd" style={{ background: st.color }} /> {st.label}
                </span>
                <div className="claim-amt">
                  <div className="a">{money(c.charges.totalBilledCents)}</div>
                  <div className="al">Claimed</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function ClaimDetail({ claim: initialClaim, onBack, onDecided }) {
  const [claim, setClaim] = useState(initialClaim);
  const [action, setAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiErr, setApiErr] = useState(null);
  const [f, setF] = useState({ approvedAmount: "", denialReason: "out_of_network", note: "", adjudicator: "a.morgan" });
  const sf = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const typeLabel = CLAIM_TYPES.find((t) => t.id === claim.type)?.label || claim.type;
  const st = STATUS[claim.status] || STATUS.submitted;
  const canAct = !["approved", "denied", "paid"].includes(claim.status);

  async function doDecide() {
    setApiErr(null);
    if (!f.adjudicator.trim()) { setApiErr("Enter adjudicator ID."); return; }
    if (action === "approve" && !(parseFloat(f.approvedAmount) > 0)) { setApiErr("Enter approved amount."); return; }
    if (action === "request_info" && !f.note.trim()) { setApiErr("Enter a note for the member."); return; }

    setSubmitting(true);
    try {
      const payload = {
        action,
        adjudicator: f.adjudicator,
        ...(action === "approve" && { approvedAmountCents: Math.round(parseFloat(f.approvedAmount) * 100) }),
        ...(action === "deny" && { denialReason: f.denialReason }),
        ...(f.note.trim() && { note: f.note }),
        ...(action === "request_info" && { note: f.note }),
      };
      const updated = await decideClaim(claim.id, payload);
      setClaim(updated);
      onDecided(updated);
      setAction(null);
    } catch (err) {
      setApiErr(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ChevronLeft size={15} /> Back to queue</button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Claim detail</div>
          <h1 className="title display" style={{ fontSize: 26, margin: "6px 0 4px" }}>{claim.reference}</h1>
          <div style={{ fontSize: 14, color: "var(--muted)" }}>{typeLabel} · {claim.provider.name}</div>
        </div>
        <span className="badge" style={{ background: st.soft, color: st.color, fontSize: 14, padding: "8px 16px" }}>
          <span className="bd" style={{ background: st.color }} /> {st.label}
        </span>
      </div>

      <div className="claim-detail">
        <h3>Member & service</h3>
        <div className="detail-grid">
          {[
            ["Member ID", claim.member.memberId],
            ["Member", claim.member.name],
            ["Patient", `${claim.patient.name} (${claim.patient.relationship})`],
            ["Date of birth", fmtDate(claim.member.dob)],
            ["Date of service", fmtDate(claim.service.dateOfService)],
            ["Place", claim.service.placeOfService],
            ["Emergency", claim.service.emergency ? "Yes" : "No"],
            ["Reason", claim.service.reason],
          ].map(([k, v]) => (
            <div className="di-item" key={k}><div className="dk">{k}</div><div className="dv">{v || "—"}</div></div>
          ))}
        </div>
      </div>

      <div className="claim-detail">
        <h3>Provider & charges</h3>
        <div className="detail-grid">
          <div className="di-item"><div className="dk">Provider</div><div className="dv">{claim.provider.name}</div></div>
          {claim.provider.npi && <div className="di-item"><div className="dk">NPI</div><div className="dv">{claim.provider.npi}</div></div>}
          {claim.provider.address && <div className="di-item" style={{ gridColumn: "1/-1" }}><div className="dk">Address</div><div className="dv">{claim.provider.address}</div></div>}
        </div>
        <div style={{ marginTop: 14 }}>
          {claim.charges.lines.map((l, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line-soft)", fontSize: 14 }}>
              <span>{l.code && <span style={{ color: "var(--muted)", marginRight: 8 }}>{l.code}</span>}{l.description}</span>
              <span style={{ fontWeight: 600 }}>{money(l.amountCents)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontWeight: 700, fontSize: 15 }}>
            <span>Total billed</span>
            <span>{money(claim.charges.totalBilledCents)}</span>
          </div>
        </div>
      </div>

      {claim.documents.length > 0 && (
        <div className="claim-detail">
          <h3>Documents ({claim.documents.length})</h3>
          <div className="files">
            {claim.documents.map((d) => (
              <div className="filerow" key={d.id}>
                <span className="fi"><FileText size={16} /></span>
                <span className="fn">{d.name}</span>
                <span className="fs">{d.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {claim.decision?.decidedAt && (
        <div className="claim-detail">
          <h3>Decision</h3>
          <div className="detail-grid">
            {claim.decision.approvedAmountCents != null && (
              <div className="di-item"><div className="dk">Approved amount</div><div className="dv">{money(claim.decision.approvedAmountCents)}</div></div>
            )}
            {claim.decision.denialReason && (
              <div className="di-item"><div className="dk">Denial reason</div><div className="dv">{claim.decision.denialReason.replace(/_/g, " ")}</div></div>
            )}
            {claim.decision.note && (
              <div className="di-item" style={{ gridColumn: "1/-1" }}><div className="dk">Note</div><div className="dv">{claim.decision.note}</div></div>
            )}
            <div className="di-item"><div className="dk">Adjudicator</div><div className="dv">{claim.decision.adjudicator}</div></div>
            <div className="di-item"><div className="dk">Decided</div><div className="dv">{fmtDate(claim.decision.decidedAt)}</div></div>
          </div>
        </div>
      )}

      <div className="claim-detail">
        <h3>Event log</h3>
        <div className="event-log">
          {[...claim.events].reverse().map((ev, i) => {
            const dotCls = ev.type === "denied" ? " denied" : ev.type === "info_requested" ? " info" : "";
            return (
              <div className="ev" key={i}>
                <span className={"ev-dot" + dotCls} />
                <div>
                  <div className="ev-lbl">{ev.label}</div>
                  <div className="ev-at">{fmtDate(ev.at)} · by {ev.by}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {canAct && (
        <div className="action-panel">
          <h3>Take action</h3>
          <div className="action-tabs">
            {[
              { id: "approve",      label: "Approve",      Icon: ThumbsUp },
              { id: "deny",         label: "Deny",         Icon: ThumbsDown },
              { id: "request_info", label: "Request info", Icon: MessageSquare },
            ].map(({ id, label, Icon }) => (
              <button key={id}
                className={`action-tab${action === id ? ` on ${id === "approve" ? "approve" : id === "deny" ? "deny" : "info"}` : ""}`}
                onClick={() => { setAction(action === id ? null : id); setApiErr(null); }}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {action && (
            <div>
              {apiErr && <div className="apierr" style={{ marginBottom: 14 }}><AlertCircle size={15} /> {apiErr}</div>}
              <div className="grid">
                <Field label="Adjudicator ID">
                  <input value={f.adjudicator} onChange={(e) => sf("adjudicator", e.target.value)} placeholder="e.g. a.morgan" />
                </Field>
                {action === "approve" && (
                  <Field label="Approved amount ($)">
                    <input inputMode="decimal" value={f.approvedAmount}
                      onChange={(e) => sf("approvedAmount", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="e.g. 280.00" />
                  </Field>
                )}
                {action === "deny" && (
                  <Field label="Denial reason">
                    <select value={f.denialReason} onChange={(e) => sf("denialReason", e.target.value)}>
                      {["out_of_network","not_covered","duplicate","missing_docs","not_medically_necessary","other"].map((r) => (
                        <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </Field>
                )}
                <div className="field full">
                  <label>Note {action !== "request_info" && <span className="opt">(optional)</span>}</label>
                  <textarea value={f.note} onChange={(e) => sf("note", e.target.value)}
                    placeholder={
                      action === "approve" ? "e.g. Allowed amount per fee schedule."
                      : action === "deny" ? "Additional context for member."
                      : "Describe what additional information is needed."
                    } />
                </div>
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                <button
                  className={`btn btn-sm ${action === "approve" ? "btn-primary" : action === "deny" ? "btn-danger" : "btn-amber"}`}
                  onClick={doDecide} disabled={submitting}>
                  {submitting ? "Saving…"
                    : action === "approve" ? "Confirm approval"
                    : action === "deny" ? "Confirm denial"
                    : "Send request"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setAction(null); setApiErr(null); }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
