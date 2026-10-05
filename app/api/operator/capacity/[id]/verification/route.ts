import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canOperateTrustState,
  resolveCapacityTrust,
  type CapacityVerificationDecision,
} from "@/lib/operations/verification";

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
  const decision = body?.decision as CapacityVerificationDecision | undefined;
  if (decision !== "verified" && decision !== "challenged") {
    return Response.json({ error: "decision must be verified or challenged" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: existing, error: readError } = await admin
    .from("capacity_slots")
    .select("id,factory_id,confidence,source")
    .eq("id", id)
    .single();

  if (readError || !existing) {
    return Response.json({ error: "Capacity slot not found" }, { status: 404 });
  }

  const trust = resolveCapacityTrust(Number(existing.confidence ?? 0), decision);
  const { data: capacity, error } = await admin
    .from("capacity_slots")
    .update(trust)
    .eq("id", id)
    .select("id,factory_id,confidence,source,updated_at")
    .single();

  if (error || !capacity) {
    return Response.json({ error: "Unable to update capacity trust" }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_user_id: auth.user.id,
    organization_id: profile.organization_id,
    action: decision === "verified" ? "capacity.verified" : "capacity.challenged",
    entity_type: "capacity_slot",
    entity_id: capacity.id,
    metadata: {
      factoryId: capacity.factory_id,
      previousConfidence: Number(existing.confidence ?? 0),
      confidence: Number(capacity.confidence),
      previousSource: existing.source,
      source: capacity.source,
    },
  });

  return Response.json({ capacity });
}
