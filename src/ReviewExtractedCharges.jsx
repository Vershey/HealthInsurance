// src/ReviewExtractedCharges.jsx
import React, { useState, useRef } from "react";

/**
 * Upload an itemized bill -> Claude vision extracts the line items ->
 * the user reviews and edits -> onApply hands the confirmed data back.
 *
 * Props:
 *   extract: async (file: File) => ({ provider, dateOfService, lines:[{code, description, amountCents}] })
 *            e.g. apiClient.extractCharges
 *   onApply: (data) => void   // data = { provider, dateOfService, lines:[{code, description, amountCents}] }
 */
export default function ReviewExtractedCharges({ extract, onApply }) {
  const [status, setStatus] = useState("idle"); // idle | loading | review | error
  const [error, setError] = useState("");
  const [provider, setProvider] = useState("");
  const [dos, setDos] = useState("");
  const [rows, setRows] = useState([]);
  const fileRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setStatus("loading");
    setError("");
    try {
      const data = await extract(file);
      setProvider(data.provider || "");
      setDos(data.dateOfService || "");
      setRows((data.lines || []).map((l, i) => ({
        id: Date.now() + i,
        code: l.code || "",
        description: l.description || "",
        amount: l.amountCents != null ? (l.amountCents / 100).toFixed(2) : "",
      })));
      setStatus(data.lines?.length ? "review" : "error");
      if (!data.lines?.length) setError("No charges were found. You can enter them manually.");
    } catch (e) {
      setError("Couldn't read that file. You can enter the charges manually.");
      setStatus("error");
    }
  }

  const upd = (id, k, v) => setRows(rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
  const del = (id) => setRows(rows.filter((r) => r.id !== id));
  const add = () => setRows([...rows, { id: Date.now(), code: "", description: "", amount: "" }]);
  const total = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  function apply() {
    onApply({
      provider,
      dateOfService: dos,
      lines: rows
        .filter((r) => r.description.trim() && parseFloat(r.amount) > 0)
        .map((r) => ({
          code: r.code.trim(),
          description: r.description.trim(),
          amountCents: Math.round(parseFloat(r.amount) * 100),
        })),
    });
    reset();
  }
  function reset() {
    setStatus("idle"); setError(""); setRows([]); setProvider(""); setDos("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="rec">
      <style>{CSS}</style>

      {status === "idle" && (
        <button type="button" className="rec-trigger" onClick={() => fileRef.current?.click()}>
          <span className="rec-spark">✦</span> Auto-fill from a bill
          <span className="rec-sub">Upload an itemized bill and we'll read the charges for you</span>
        </button>
      )}

      {status === "loading" && (
        <div className="rec-loading"><span className="rec-dot" /> Reading your bill…</div>
      )}

      {status === "error" && (
        <div className="rec-error">
          {error}
          <button type="button" className="rec-link" onClick={reset}>Try another file</button>
        </div>
      )}

      {status === "review" && (
        <div className="rec-panel">
          <div className="rec-head">
            <div>
              <div className="rec-title">Review extracted charges</div>
              <div className="rec-note">Check each line against your bill — nothing is added until you apply it.</div>
            </div>
            <button type="button" className="rec-link" onClick={reset}>Discard</button>
          </div>

          <div className="rec-meta">
            <label>Provider
              <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Provider or facility" />
            </label>
            <label>Date of service
              <input value={dos} onChange={(e) => setDos(e.target.value)} placeholder="YYYY-MM-DD" />
            </label>
          </div>

          <div className="rec-rowhead"><span>Code</span><span>Description</span><span>Amount</span><span /></div>
          {rows.map((r) => (
            <div className="rec-row" key={r.id}>
              <input className="c-code" value={r.code} onChange={(e) => upd(r.id, "code", e.target.value)} placeholder="CPT" />
              <input className="c-desc" value={r.description} onChange={(e) => upd(r.id, "description", e.target.value)} placeholder="Service" />
              <input className="c-amt" inputMode="decimal" value={r.amount}
                onChange={(e) => upd(r.id, "amount", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.00" />
              <button type="button" className="c-del" onClick={() => del(r.id)} aria-label="Remove">✕</button>
            </div>
          ))}

          <div className="rec-foot">
            <button type="button" className="rec-add" onClick={add}>+ Add line</button>
            <div className="rec-total">Total <strong>${total.toFixed(2)}</strong></div>
          </div>

          <div className="rec-actions">
            <button type="button" className="rec-ghost" onClick={reset}>Cancel</button>
            <button type="button" className="rec-apply" onClick={apply} disabled={!rows.length}>
              Apply to claim
            </button>
          </div>
          <p className="rec-disclaimer">Read by AI from your document — please verify before submitting.</p>
        </div>
      )}

      <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" style={{ display: "none" }}
        onChange={(e) => { handleFile(e.target.files?.[0]); }} />
    </div>
  );
}

const CSS = `
.rec{font-family:'Inter',system-ui,sans-serif;color:#16302E;}
.rec *{box-sizing:border-box;}
.rec-trigger{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;text-align:left;
  border:1.5px dashed #C7D8D2;background:#F2F8F6;border-radius:12px;padding:14px 16px;cursor:pointer;
  font:inherit;font-weight:600;font-size:14.5px;color:#0E5F5A;}
.rec-trigger:hover{border-color:#0E5F5A;background:#E7F2EE;}
.rec-spark{margin-right:6px;}
.rec-sub{font-weight:400;font-size:12.5px;color:#5C7370;}
.rec-loading{display:flex;align-items:center;gap:10px;padding:14px 16px;border:1px solid #DCE6E2;border-radius:12px;
  background:#fff;font-size:14px;color:#0E5F5A;font-weight:500;}
.rec-dot{width:10px;height:10px;border-radius:50%;border:2px solid #BFE0D7;border-top-color:#0E5F5A;
  animation:rec-spin .7s linear infinite;}
@keyframes rec-spin{to{transform:rotate(360deg);}}
.rec-error{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;
  background:#FBEDE9;color:#8A3A28;font-size:13.5px;}
.rec-link{border:0;background:transparent;color:#0E5F5A;font:inherit;font-weight:600;font-size:13px;cursor:pointer;}
.rec-link:hover{text-decoration:underline;}
.rec-panel{border:1px solid #DCE6E2;border-radius:14px;background:#fff;padding:18px;}
.rec-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px;}
.rec-title{font-weight:700;font-size:15.5px;}
.rec-note{font-size:12.5px;color:#5C7370;margin-top:2px;}
.rec-meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
.rec-meta label{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:600;color:#16302E;}
.rec input{font:inherit;font-size:14px;padding:9px 11px;border:1px solid #DCE6E2;border-radius:9px;width:100%;}
.rec input:focus{outline:none;border-color:#0E5F5A;box-shadow:0 0 0 3px #E2EFEC;}
.rec-rowhead,.rec-row{display:grid;grid-template-columns:90px 1fr 110px 30px;gap:10px;align-items:center;}
.rec-rowhead{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#8AA39D;margin-bottom:6px;padding:0 2px;}
.rec-row{margin-bottom:8px;}
.c-del{border:0;background:transparent;color:#9DB1AC;font-size:14px;cursor:pointer;padding:6px;border-radius:6px;}
.c-del:hover{color:#B4452F;background:#FBEDE9;}
.rec-foot{display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:10px;border-top:1px solid #EEF3F1;}
.rec-add{border:1px dashed #C7D8D2;background:transparent;color:#0E5F5A;font:inherit;font-weight:600;font-size:13px;
  border-radius:9px;padding:8px 12px;cursor:pointer;}
.rec-add:hover{background:#E7F2EE;border-color:#0E5F5A;}
.rec-total{font-size:14px;color:#5C7370;}
.rec-total strong{font-size:17px;color:#16302E;margin-left:6px;}
.rec-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px;}
.rec-ghost{border:1px solid #DCE6E2;background:#fff;color:#16302E;font:inherit;font-weight:600;font-size:14px;
  border-radius:10px;padding:10px 18px;cursor:pointer;}
.rec-apply{border:0;background:#0E5F5A;color:#fff;font:inherit;font-weight:600;font-size:14px;border-radius:10px;
  padding:10px 20px;cursor:pointer;}
.rec-apply:hover{background:#0A3D3A;}
.rec-apply:disabled{opacity:.5;cursor:not-allowed;}
.rec-disclaimer{font-size:11.5px;color:#8AA39D;margin:12px 0 0;text-align:right;}
`;
