import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canOperateTrustState } from "@/lib/operations/verification";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id,role")
    .eq("id", auth.user.id)
    .single();

  if (!profile || !canOperateTrustState(profile.role)) {
    return Response.json({ error: "Operator account required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.verified !== "boolean") {
    return Response.json({ error: "verified must be a boolean" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: factory, error } = await admin
    .from("factories")
    .update({
      verified: body.verified,
      verified_at: body.verified ? new Date().toISOString() : null,
      verified_by: body.verified ? auth.user.id : null,
    })
    .eq("id", id)
    .select("id,organization_id,legal_name,verified,verified_at,verified_by,updated_at")
    .single();

  if (error || !factory) {
    return Response.json({ error: "Factory not found" }, { status: 404 });
  }

  await admin.from("audit_logs").insert({
    actor_user_id: auth.user.id,
    organization_id: profile.organization_id,
    action: body.verified ? "factory.verified" : "factory.verification_revoked",
    entity_type: "factory",
    entity_id: factory.id,
    metadata: {
      targetOrganizationId: factory.organization_id,
      legalName: factory.legal_name,
      verified: body.verified,
    },
  });

  return Response.json({ factory });
}
