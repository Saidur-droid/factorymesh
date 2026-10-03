import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { routeOrder, type RoutingCandidate } from "@/lib/routing/engine";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: order }, { data: profile }] = await Promise.all([
    supabase
      .from("orders")
      .select("id,buyer_organization_id,product_category,quantity,target_unit_price,required_delivery_date,compliance_requirements,status")
      .eq("id", id)
      .single(),
    supabase
      .from("profiles")
      .select("organization_id,role")
      .eq("id", auth.user.id)
      .single(),
  ]);

  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
  if (!profile || !["buyer", "operator", "admin"].includes(profile.role)) {
    return Response.json({ error: "This account cannot route buyer orders" }, { status: 403 });
  }
  if (profile.role === "buyer" && profile.organization_id !== order.buyer_organization_id) {
    return Response.json({ error: "Order does not belong to this buyer organization" }, { status: 403 });
  }
  if (!["submitted", "matching"].includes(order.status)) {
    return Response.json({ error: "Order cannot be routed in its current state" }, { status: 409 });
  }

  const admin = createSupabaseAdminClient();
  const { data: rows, error } = await admin
    .from("capacity_slots")
    .select("id,available_units,reserved_units,ends_on,confidence,factories!inner(id,legal_name,product_categories,certifications,indicative_cost_min,indicative_cost_max,on_time_rate,defect_rate)")
    .in("status", ["available", "held"])
    .gte("ends_on", new Date().toISOString().slice(0, 10));

  if (error) return Response.json({ error: "Unable to load routing candidates" }, { status: 500 });

  const candidates: RoutingCandidate[] = (rows ?? []).map((row: any) => ({
    factoryId: row.factories.id,
    factoryName: row.factories.legal_name,
    capacitySlotId: row.id,
    productCategories: row.factories.product_categories ?? [],
    certifications: row.factories.certifications ?? [],
    availableUnits: Math.max(0, row.available_units - row.reserved_units),
    slotEndsOn: row.ends_on,
    indicativeCostMin: row.factories.indicative_cost_min == null ? undefined : Number(row.factories.indicative_cost_min),
    indicativeCostMax: row.factories.indicative_cost_max == null ? undefined : Number(row.factories.indicative_cost_max),
    onTimeRate: row.factories.on_time_rate == null ? undefined : Number(row.factories.on_time_rate),
    defectRate: row.factories.defect_rate == null ? undefined : Number(row.factories.defect_rate),
    capacityConfidence: row.confidence == null ? undefined : Number(row.confidence),
  }));

  const results = routeOrder({
    productCategory: order.product_category,
    quantity: order.quantity,
    targetUnitPrice: order.target_unit_price == null ? undefined : Number(order.target_unit_price),
    requiredDeliveryDate: order.required_delivery_date,
    complianceRequirements: order.compliance_requirements ?? [],
  }, candidates);

  await admin.from("order_matches").delete().eq("order_id", id).eq("status", "suggested");

  const top = results.slice(0, 20);
  let persisted: any[] = [];
  if (top.length > 0) {
    const { data: inserted, error: insertError } = await admin
      .from("order_matches")
      .insert(top.map((result) => ({
        order_id: id,
        factory_id: result.factoryId,
        capacity_slot_id: result.capacitySlotId ?? null,
        score: result.score,
        price_score: result.scores.price,
        capacity_score: result.scores.capacity,
        capability_score: result.scores.capability,
        delivery_score: result.scores.delivery,
        quality_score: result.scores.quality,
        compliance_score: result.scores.compliance,
        rationale: { reasons: result.reasons },
      })))
      .select("id,factory_id,capacity_slot_id");

    if (insertError) return Response.json({ error: "Unable to persist routing matches" }, { status: 500 });
    persisted = inserted ?? [];
  }

  await admin.from("orders").update({ status: "matching" }).eq("id", id);
  await admin.from("audit_logs").insert({
    actor_user_id: auth.user.id,
    organization_id: order.buyer_organization_id,
    action: "order.routed",
    entity_type: "order",
    entity_id: id,
    metadata: { candidateCount: candidates.length, matchCount: top.length },
  });

  const matchIds = new Map(persisted.map((row) => [`${row.factory_id}:${row.capacity_slot_id}`, row.id]));
  return Response.json({
    matches: top.map((result) => ({
      ...result,
      id: matchIds.get(`${result.factoryId}:${result.capacitySlotId ?? null}`),
    })),
  });
}
