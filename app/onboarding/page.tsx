import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", auth.user.id).maybeSingle();
  if (profile) redirect("/dashboard");

  return (
    <main className="auth-shell">
      <section className="auth-card wide">
        <span className="eyebrow">Workspace setup</span>
        <h1 className="auth-title">Tell FactoryMesh how you operate.</h1>
        <p className="muted">Brands submit production demand. Factories publish executable capacity. You can add teammates and deeper integrations later.</p>
        <OnboardingForm />
      </section>
    </main>
  );
}
