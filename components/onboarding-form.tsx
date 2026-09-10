"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"buyer" | "factory">("buyer");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const productCategories = String(form.get("productCategories") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        organizationName: form.get("organizationName"),
        role,
        countryCode: form.get("countryCode"),
        city: form.get("city") || undefined,
        productCategories,
      }),
    });

    const body = await response.json();
    if (!response.ok) setError(body.error ?? "Unable to complete onboarding");
    else {
      router.push("/dashboard");
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="segmented">
        <button type="button" className={role === "buyer" ? "active" : "ghost"} onClick={() => setRole("buyer")}>Buyer / Brand</button>
        <button type="button" className={role === "factory" ? "active" : "ghost"} onClick={() => setRole("factory")}>Factory</button>
      </div>
      <label>Full name<input name="fullName" required minLength={2} /></label>
      <label>Organization<input name="organizationName" required minLength={2} /></label>
      <div className="form-grid">
        <label>Country code<input name="countryCode" defaultValue="BD" required maxLength={2} /></label>
        <label>City<input name="city" placeholder="Dhaka" /></label>
      </div>
      {role === "factory" && (
        <label>Product categories<input name="productCategories" placeholder="Hoodies, T-Shirts, Knitwear" /></label>
      )}
      <button disabled={busy} type="submit">{busy ? "Creating workspace…" : "Create workspace"}</button>
      {error && <p className="form-message error" role="alert">{error}</p>}
    </form>
  );
}
