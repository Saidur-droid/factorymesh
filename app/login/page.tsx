import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link href="/" className="brand-link">FactoryMesh</Link>
        <span className="eyebrow">Secure workspace</span>
        <h1 className="auth-title">Operate manufacturing capacity as a network.</h1>
        <p className="muted">Sign in as a buyer or factory operator. New accounts continue through organization onboarding.</p>
        <AuthForm />
      </section>
    </main>
  );
}
