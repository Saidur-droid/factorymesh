"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Match = {
  factoryId: string;
  factoryName: string;
  score: number;
  availableUnits: number;
  slotEndsOn: string;
  reasons: string[];
};

export function OrderActions({ orderId, quantity }: { orderId: string; quantity: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function route() {
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/orders/${orderId}/route`, { method: "POST" });
    const body = await response.json();
    if (!response.ok) setMessage(body.error ?? "Unable to route order");
    else setMatches(body.matches ?? []);
    setBusy(false);
    router.refresh();
  }

  async function reserve(matchId: string, availableUnits: number) {
    setBusy(true);
    setMessage(null);
    const units = Math.min(quantity, availableUnits);
    const response = await fetch(`/api/matches/${matchId}/reserve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId, units }),
    });
    const body = await response.json();
    setMessage(response.ok ? `Reserved ${units.toLocaleString()} units.` : body.error ?? "Unable to reserve capacity");
    setBusy(false);
    if (response.ok) {
      setMatches([]);
      router.refresh();
    }
  }

  return (
    <div className="order-actions">
      <button type="button" disabled={busy} onClick={route}>{busy ? "Working…" : "Find capacity"}</button>
      {message && <span className="inline-message" role="status">{message}</span>}
      {matches.length > 0 && (
        <div className="match-list">
          {matches.slice(0, 5).map((match: any) => (
            <article className="match-card" key={`${match.factoryId}-${match.slotEndsOn}`}>
              <div><strong>{match.factoryName}</strong><span>Score {match.score}</span></div>
              <div><span>{match.availableUnits.toLocaleString()} units</span><span>Ends {match.slotEndsOn}</span></div>
              <small>{match.reasons?.join(" · ")}</small>
              {match.id ? <button disabled={busy} type="button" onClick={() => reserve(match.id, match.availableUnits)}>Reserve</button> : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
