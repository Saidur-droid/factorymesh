"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CapacityForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/capacity", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        startsOn: form.get("startsOn"),
        endsOn: form.get("endsOn"),
        lineType: form.get("lineType") || undefined,
        productCategory: form.get("productCategory"),
        availableUnits: form.get("availableUnits"),
        confidence: form.get("confidence") || 70,
        source: "manual",
      }),
    });

    const body = await response.json();
    if (!response.ok) setMessage(body.error ?? "Unable to publish capacity");
    else {
      event.currentTarget.reset();
      setMessage("Capacity slot published.");
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <form className="workspace-form" onSubmit={submit}>
      <div className="form-grid two">
        <label>Product category<input name="productCategory" required placeholder="Hoodies" /></label>
        <label>Line / capability<input name="lineType" placeholder="Knit sewing line" /></label>
      </div>
      <div className="form-grid four">
        <label>Starts<input name="startsOn" type="date" required /></label>
        <label>Ends<input name="endsOn" type="date" required /></label>
        <label>Available units<input name="availableUnits" type="number" min="0" required /></label>
        <label>Confidence %<input name="confidence" type="number" min="0" max="100" defaultValue="70" /></label>
      </div>
      <div className="form-actions"><button disabled={busy}>{busy ? "Publishing…" : "Publish capacity"}</button>{message && <span role="status">{message}</span>}</div>
    </form>
  );
}
