"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Match = {
  id?: string;
  factoryId: string;
  factoryName: string;
  score: number;
  availableUnits: number;
  slotEndsOn: string;
  reasons: string[];
  status?: string;
  factoryResponse?: "pending" | "accepted" | "rejected";
  quotedUnitPrice?: number | null;
  quotedCurrency?: string | null;
  promisedShipDate?: string | null;
  factoryNote?: string | null;
  freshness?: string;
  effectiveConfidence?: number;
};

export function OrderActions({ orderId, quantity }: { orderId: string; quantity: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    const response = await fetch("/api/orders/" + orderId + "/route", { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json();
    setMatches(body.matches ?? []);
  }, [orderId]);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  async function route() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/orders/" + orderId + "/route", { method: "POST" });
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
    const response = await fetch("/api/matches/" + matchId + "/reserve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId, units }),
    });
    const body = await response.json();
    setMessage(response.ok ? "Reserved " + units.toLocaleString() + " units." : body.error ?? "Unable to reserve capacity");
    setBusy(false);
    if (response.ok) {
      setMatches([]);
      router.refresh();
    } else {
      await loadMatches();
    }
  }

  return (
    <div className="order-actions">
      <button type="button" disabled={busy} onClick={route}>
        {busy ? "Working…" : matches.length ? "Refresh capacity" : "Find capacity"}
      </button>
      {message && <span className="inline-message" role="status">{message}</span>}
      {matches.length > 0 && (
        <div className="match-list">
          {matches.slice(0, 5).map((match) => {
            const accepted = match.factoryResponse === "accepted";
            return (
              <article className="match-card" key={match.id ?? (match.factoryId + "-" + match.slotEndsOn)}>
                <div>
                  <strong>{match.factoryName}</strong>
                  <span>Score {match.score}</span>
                </div>
                <div>
                  <span>{match.availableUnits.toLocaleString()} units</span>
                  <span>Ends {match.slotEndsOn}</span>
                </div>
                <small>{match.reasons?.join(" · ")}</small>
                <small>
                  Trust {match.freshness ?? "unverified"}
                  {match.effectiveConfidence != null ? " · " + match.effectiveConfidence + "% effective confidence" : ""}
                </small>
                {accepted ? (
                  <>
                    <small>
                      Factory accepted
                      {match.quotedUnitPrice != null
                        ? " · " + (match.quotedCurrency ?? "USD") + " " + match.quotedUnitPrice.toFixed(2) + "/unit"
                        : ""}
                      {match.promisedShipDate ? " · ship " + match.promisedShipDate : ""}
                    </small>
                    {match.factoryNote ? <small>{match.factoryNote}</small> : null}
                    {match.id ? (
                      <button
                        disabled={busy}
                        type="button"
                        onClick={() => reserve(match.id!, match.availableUnits)}
                      >
                        Reserve confirmed capacity
                      </button>
                    ) : null}
                  </>
                ) : (
                  <small>Awaiting factory commercial confirmation before reservation.</small>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
