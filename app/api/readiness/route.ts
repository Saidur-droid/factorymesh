import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  if (env.APP_ENV !== "production") {
    return Response.json(
      { ready: false, service: "factorymesh", reason: "not-production" },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("organizations").select("id", { head: true, count: "exact" });
    if (error) throw error;

    return Response.json(
      { ready: true, service: "factorymesh", timestamp: new Date().toISOString() },
      { headers: { "cache-control": "no-store" } }
    );
  } catch {
    return Response.json(
      { ready: false, service: "factorymesh", reason: "dependency-check-failed" },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }
}
