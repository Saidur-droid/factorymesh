"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ProductionBriefForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const complianceRequirements = String(form.get("complianceRequirements") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        productCategory: form.get("productCategory"),
        quantity: form.get("quantity"),
        targetUnitPrice: form.get("targetUnitPrice") || undefined,
        currency: form.get("currency") || "USD",
        requiredDeliveryDate: form.get("requiredDeliveryDate"),
        shipToCountryCode: form.get("shipToCountryCode") || undefined,
        materialRequirements: form.get("materialRequirements") || undefined,
        complianceRequirements,
        notes: form.get("notes") || undefined,
      }),
    });

    const body = await response.json();
    if (!response.ok) setMessage(body.error ?? "Unable to create brief");
    else {
      event.currentTarget.reset();
      setMessage("Production brief submitted.");
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <form className="workspace-form" onSubmit={submit}>
      <div className="form-grid two">
        <label>Brief title<input name="title" required placeholder="300k heavyweight hoodies" /></label>
        <label>Product category<input name="productCategory" required placeholder="Hoodies" /></label>
      </div>
      <div className="form-grid four">
        <label>Quantity<input name="quantity" type="number" min="1" required /></label>
        <label>Target / unit<input name="targetUnitPrice" type="number" min="0" step="0.01" /></label>
        <label>Currency<input name="currency" defaultValue="USD" maxLength={3} /></label>
        <label>Delivery date<input name="requiredDeliveryDate" type="date" required /></label>
      </div>
      <div className="form-grid two">
        <label>Ship-to country<input name="shipToCountryCode" placeholder="US" maxLength={2} /></label>
        <label>Compliance requirements<input name="complianceRequirements" placeholder="GOTS, OEKO-TEX" /></label>
      </div>
      <label>Materials<textarea name="materialRequirements" rows={3} placeholder="420gsm cotton fleece, washed finish…" /></label>
      <label>Notes<textarea name="notes" rows={3} placeholder="Packaging, colorways, labeling, special constraints…" /></label>
      <div className="form-actions"><button disabled={busy}>{busy ? "Submitting…" : "Submit production brief"}</button>{message && <span role="status">{message}</span>}</div>
    </form>
  );
}
