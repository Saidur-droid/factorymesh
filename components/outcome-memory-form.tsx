"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OutcomeMemoryForm({
  orderId,
  currency,
}: {
  orderId: string;
  currency: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [actualShipDate, setActualShipDate] = useState("");
  const [defectRate, setDefectRate] = useState("");
  const [realizedUnitPrice, setRealizedUnitPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/operator/orders/" + orderId + "/outcome", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actualShipDate,
        defectRate: Number(defectRate),
        realizedUnitPrice: realizedUnitPrice === "" ? null : Number(realizedUnitPrice),
        currency,
        notes,
      }),
    });
    const body = await response.json();
    setMessage(
      response.ok
        ? "Outcome recorded. Factory reliability metrics updated."
        : body.error ?? "Unable to record outcome",
    );
    setBusy(false);
    if (response.ok) router.refresh();
  }

  return (
    <div className="order-actions">
      <strong>Outcome memory</strong>
      <label>
        <span>Actual ship date</span>
        <input
          type="date"
          value={actualShipDate}
          onChange={(event) => setActualShipDate(event.target.value)}
        />
      </label>
      <label>
        <span>Defect / rework rate %</span>
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={defectRate}
          onChange={(event) => setDefectRate(event.target.value)}
        />
      </label>
      <label>
        <span>Realized unit price ({currency})</span>
        <input
          type="number"
          min="0"
          step="0.0001"
          value={realizedUnitPrice}
          onChange={(event) => setRealizedUnitPrice(event.target.value)}
          placeholder="Optional"
        />
      </label>
      <label>
        <span>Outcome notes</span>
        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={1000}
          placeholder="Delay, rework, exceptions, lessons"
        />
      </label>
      <button
        type="button"
        disabled={busy || !actualShipDate || defectRate === ""}
        onClick={save}
      >
        {busy ? "Saving…" : "Record outcome"}
      </button>
      {message && <span className="inline-message" role="status">{message}</span>}
    </div>
  );
}
