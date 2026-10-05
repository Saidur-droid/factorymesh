"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FactoryCommercialResponse({
  matchId,
  currentResponse,
  quotedUnitPrice,
  quotedCurrency,
  promisedShipDate,
  factoryNote,
}: {
  matchId: string;
  currentResponse: "pending" | "accepted" | "rejected";
  quotedUnitPrice: number | null;
  quotedCurrency: string | null;
  promisedShipDate: string | null;
  factoryNote: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [price, setPrice] = useState(quotedUnitPrice == null ? "" : String(quotedUnitPrice));
  const [currency, setCurrency] = useState(quotedCurrency ?? "USD");
  const [shipDate, setShipDate] = useState(promisedShipDate ?? "");
  const [note, setNote] = useState(factoryNote ?? "");
  const [message, setMessage] = useState<string | null>(null);

  async function respond(decision: "accept" | "reject") {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/matches/" + matchId + "/respond", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        decision,
        quotedUnitPrice: price === "" ? null : Number(price),
        quotedCurrency: currency,
        promisedShipDate: shipDate || null,
        note,
      }),
    });
    const body = await response.json();
    setMessage(
      response.ok
        ? decision === "accept"
          ? "Commercial confirmation sent to buyer."
          : "Opportunity declined."
        : body.error ?? "Unable to record response",
    );
    setBusy(false);
    if (response.ok) router.refresh();
  }

  return (
    <div className="order-actions">
      <span className="status">Factory response: {currentResponse}</span>
      <label>
        <span>Quoted unit price</span>
        <input
          type="number"
          min="0"
          step="0.0001"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="Optional"
        />
      </label>
      <label>
        <span>Currency</span>
        <input
          value={currency}
          onChange={(event) => setCurrency(event.target.value.toUpperCase())}
          maxLength={3}
        />
      </label>
      <label>
        <span>Promised ship date</span>
        <input
          type="date"
          value={shipDate}
          onChange={(event) => setShipDate(event.target.value)}
        />
      </label>
      <label>
        <span>Factory note</span>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          placeholder="Feasibility, constraints, line commitment"
        />
      </label>
      <button type="button" disabled={busy || !shipDate} onClick={() => respond("accept")}>
        {busy ? "Saving…" : "Accept & confirm"}
      </button>
      <button type="button" disabled={busy} onClick={() => respond("reject")}>
        Decline
      </button>
      {message && <span className="inline-message" role="status">{message}</span>}
    </div>
  );
}
