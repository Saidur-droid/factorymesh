import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canFactoryRespondToMatch,
  normalizeCommercialResponse,
  type CommercialDecision,
} from "@/lib/commercial/response";

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

  if (!profile?.organization_id || profile.role !== "factory") {
    return Response.json({ error: "Factory account required" }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const [{ data: factory }, { data: match }] = await Promise.all([
    admin
      .from("factories")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .single(),
    admin
      .from("order_matches")
      .select("id,order_id,factory_id,status,orders!inner(id,assigned_factory_id)")
      .eq("id", id)
      .single(),
  ]);

  if (!factory || !match) {
    return Response.json({ error: "Match not found" }, { status: 404 });
  }

  const order = Array.isArray((match as any).orders)
    ? (match as any).orders[0]
    : (match as any).orders;

  if (!canFactoryRespondToMatch({
    factoryOwnsMatch: match.factory_id === factory.id,
    orderAssignedFactoryId: order?.assigned_factory_id ?? null,
    matchStatus: match.status,
  })) {
    return Response.json({ error: "This match cannot be updated by this factory" }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const decision = body?.decision as CommercialDecision | undefined;
  if (decision !== "accept" && decision !== "reject") {
    return Response.json({ error: "decision must be accept or reject" }, { status: 400 });
  }

  let response;
  try {
    response = normalizeCommercialResponse({
      decision,
      quotedUnitPrice:
        body?.quotedUnitPrice == null ? null : Number(body.quotedUnitPrice),
      quotedCurrency: body?.quotedCurrency ?? "USD",
      promisedShipDate: body?.promisedShipDate ?? null,
      note: body?.note ?? null,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid commercial response" },
      { status: 400 },
    );
  }

  if (decision === "accept" && !response.promisedShipDate) {
    return Response.json({ error: "Promised ship date is required to accept" }, { status: 400 });
  }

  const { data: updated, error } = await admin
    .from("order_matches")
    .update({
      status: response.matchStatus,
      factory_response: decision === "accept" ? "accepted" : "rejected",
      quoted_unit_price: response.quotedUnitPrice,
      quoted_currency: response.quotedCurrency,
      promised_ship_date: response.promisedShipDate,
      factory_note: response.note,
      responded_at: new Date().toISOString(),
      responded_by: auth.user.id,
    })
    .eq("id", id)
    .select("id,order_id,factory_id,status,factory_response,quoted_unit_price,quoted_currency,promised_ship_date,factory_note,responded_at")
    .single();

  if (error || !updated) {
    return Response.json({ error: "Unable to record factory response" }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_user_id: auth.user.id,
    organization_id: profile.organization_id,
    action: decision === "accept" ? "match.factory_accepted" : "match.factory_rejected",
    entity_type: "order_match",
    entity_id: id,
    metadata: {
      orderId: match.order_id,
      quotedUnitPrice: response.quotedUnitPrice,
      quotedCurrency: response.quotedCurrency,
      promisedShipDate: response.promisedShipDate,
    },
  });

  return Response.json({ match: updated });
}
