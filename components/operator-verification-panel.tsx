"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FactoryTrustRow = {
  id: string;
  legalName: string;
  verified: boolean;
  city: string | null;
  countryCode: string;
};

type CapacityTrustRow = {
  id: string;
  factoryId: string;
  productCategory: string | null;
  startsOn: string;
  endsOn: string;
  confidence: number;
  source: string;
  freshness: "fresh" | "aging" | "stale" | "unverified";
  effectiveConfidence: number;
  lastVerifiedAt: string | null;
};

export function OperatorVerificationPanel({
  factories,
  capacity,
}: {
  factories: FactoryTrustRow[];
  capacity: CapacityTrustRow[];
}) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function verifyFactory(factoryId: string, verified: boolean) {
    const key = `factory:${factoryId}`;
    setBusyKey(key);
    setMessage(null);
    const response = await fetch(
      `/api/operator/factories/${factoryId}/verification`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ verified }),
      },
    );
    const body = await response.json();
    setMessage(
      response.ok
        ? verified
          ? "Factory verification recorded."
          : "Factory verification revoked."
        : body.error ?? "Unable to update factory verification",
    );
    setBusyKey(null);
    if (response.ok) router.refresh();
  }

  async function verifyCapacity(
    capacityId: string,
    decision: "verified" | "challenged",
  ) {
    const key = `capacity:${capacityId}`;
    setBusyKey(key);
    setMessage(null);
    const response = await fetch(
      `/api/operator/capacity/${capacityId}/verification`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      },
    );
    const body = await response.json();
    setMessage(
      response.ok
        ? decision === "verified"
          ? "Capacity verification recorded."
          : "Capacity challenge recorded."
        : body.error ?? "Unable to update capacity verification",
    );
    setBusyKey(null);
    if (response.ok) router.refresh();
  }

  const factoryNames = new Map(factories.map((factory) => [factory.id, factory.legalName]));

  return (
    <div className="operator-verification">
      {message && <p className="inline-message" role="status">{message}</p>}

      <div className="data-list">
        {factories.length === 0 ? (
          <p className="empty-state">No factories available for verification.</p>
        ) : factories.map((factory) => (
          <article className="data-row" key={factory.id}>
            <div className="data-main">
              <strong>{factory.legalName}</strong>
              <span>{factory.city ?? "City not set"} · {factory.countryCode}</span>
            </div>
            <div>
              <span>Trust state</span>
              <strong>{factory.verified ? "Verified" : "Unverified"}</strong>
            </div>
            <div className="order-actions">
              <button
                type="button"
                disabled={busyKey === `factory:${factory.id}`}
                onClick={() => verifyFactory(factory.id, !factory.verified)}
              >
                {factory.verified ? "Revoke verification" : "Verify factory"}
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="data-list">
        {capacity.length === 0 ? (
          <p className="empty-state">No live capacity awaiting review.</p>
        ) : capacity.map((slot) => (
          <article className="data-row" key={slot.id}>
            <div className="data-main">
              <strong>{slot.productCategory ?? "Uncategorised capacity"}</strong>
              <span>{factoryNames.get(slot.factoryId) ?? slot.factoryId}</span>
            </div>
            <div>
              <span>Window</span>
              <strong>{slot.startsOn} → {slot.endsOn}</strong>
            </div>
            <div>
              <span>Trust</span>
              <strong>
                {slot.confidence.toFixed(0)}% raw · {slot.effectiveConfidence.toFixed(0)}% effective
              </strong>
              <span>
                {slot.freshness}
                {slot.lastVerifiedAt ? " · verified " + new Date(slot.lastVerifiedAt).toLocaleDateString() : " · never verified"}
                {" · " + slot.source}
              </span>
            </div>
            <div className="order-actions">
              <button
                type="button"
                disabled={busyKey === `capacity:${slot.id}`}
                onClick={() => verifyCapacity(slot.id, "verified")}
              >
                Verify capacity
              </button>
              <button
                type="button"
                disabled={busyKey === `capacity:${slot.id}`}
                onClick={() => verifyCapacity(slot.id, "challenged")}
              >
                Challenge
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
