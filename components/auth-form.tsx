"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
      });
      if (error) {
        setMessage(error.message);
      } else if (data.session) {
        router.push("/onboarding");
        router.refresh();
      } else {
        setMessage("Account created. Check your email to verify the account, then continue to onboarding.");
      }
    }

    setBusy(false);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="segmented">
        <button type="button" className={mode === "signin" ? "active" : "ghost"} onClick={() => setMode("signin")}>Sign in</button>
        <button type="button" className={mode === "signup" ? "active" : "ghost"} onClick={() => setMode("signup")}>Create account</button>
      </div>
      <label>Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Password<input required minLength={8} type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <button disabled={busy} type="submit">{busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}</button>
      {message && <p className="form-message" role="status">{message}</p>}
    </form>
  );
}
