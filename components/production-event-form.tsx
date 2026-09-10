"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const EVENTS = [
  ["production.started", "Start production"],
  ["cutting.completed", "Cutting complete"],
  ["sewing.progress", "Sewing progress"],
  ["finishing.completed", "Finishing complete"],
  ["qc.passed", "QC passed"],
  ["qc.failed", "QC failed"],
  ["shipment.booked", "Shipment booked"],
  ["shipment.dispatched", "Shipment dispatched"],
  ["exception.reported", "Report exception"],
] as const;

export function ProductionEventForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const note = String(form.get("note") ?? "").trim();

    const response = await fetch("/api/production-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId,
        eventType: form.get("eventType"),
        progressPercent: form.get("progressPercent") || undefined,
        payload: note ? { note } : {},
      }),
    });
    const body = await response.json();
    setMessage(response.ok ? "Milestone recorded." : body.error ?? "Unable to record milestone");
    setBusy(false);
    if (response.ok) {
      event.currentTarget.reset();
      router.refresh();
    }
  }

  return (
    <form className="event-form" onSubmit={submit}>
      <select name="eventType" required defaultValue="production.started">
        {EVENTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <input name="progressPercent" type="number" min="0" max="100" placeholder="Progress %" />
      <input name="note" maxLength={500} placeholder="Optional note" />
      <button disabled={busy}>{busy ? "Saving…" : "Record"}</button>
      {message && <small role="status">{message}</small>}
    </form>
  );
}
