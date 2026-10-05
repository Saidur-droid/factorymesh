import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { routeOrder, type RoutingCandidate } from "@/lib/routing/engine";
import {
  evaluateCapacityFreshness,
  isCapacityRoutable,
} from "@/lib/capacity/freshness";

async function authorizeBuyerOrder(orderId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const [{ data: order }, { data: profile }] = await Promise.all([
    supabase
      .from("orders")
      .select("id,buyer_organization_id,product_category,quantity,target_unit_price,required_delivery_date,compliance_requirements,status")
      .eq("id", orderId)
      .single(),
    supabase
      .from("profiles")
      .select("organization_id,role")
      .eq("id", auth.user.id)
      .single(),
  ]);

  if (!order) {
    return { error: Response.json({ error: "Order not found" }, { status: 404 }) };
  }
  if (!profile || !["buyer", "operator", "admin"].includes(profile.role)) {
    return { error: Response.json({ error: "This account cannot route buyer orders" }, { status: 403 }) };
  }
  if (profile.role === "buyer" && profile.organization_id !== order.buyer_organization_id) {
    return { error: Response.json({ error: "Order does not belong to this buyer organization" }, { status: 403 }) };
  }

  return { supabase, auth, order, profile };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authorized = await authorizeBuyerOrder(id);
  if ("error" in authorized) return authorized.error;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("order_matches")
    .select("id,factory_id,capacity_slot_id,score,rationale,status,factory_response,quoted_unit_price,quoted_currency,promised_ship_date,factory_note,responded_at,factories!inner(legal_name),capacity_slots(available_units,reserved_units,ends_on,last_verified_at,updated_at,confidence)")
    .eq("order_id", id)
    .neq("status", "rejected")
    .order("score", { ascending: false })
    .limit(20);

  if (error) return Response.json({ error: "Unable to load routing matches" }, { status: 500 });

  return Response.json({
    matches: (data ?? []).map((row: any) => {
      const factory = Array.isArray(row.factories) ? row.factories[0] : row.factories;
      const slot = Array.isArray(row.capacity_slots) ? row.capacity_slots[0] : row.capacity_slots;
      const freshness = slot
        ? evaluateCapacityFreshness({
            confidence: Number(slot.confidence ?? 0),
            lastVerifiedAt: slot.last_verified_at ?? null,
            updatedAt: slot.updated_at,
          })
        : null;

      return {
        id: row.id,
        factoryId: row.factory_id,
        factoryName: factory?.legal_name ?? "Factory",
        capacitySlotId: row.capacity_slot_id,
        score: Number(row.score),
        availableUnits: slot
          ? Math.max(0, Number(slot.available_units) - Number(slot.reserved_units))
          : 0,
        slotEndsOn: slot?.ends_on ?? "",
        reasons: row.rationale?.reasons ?? [],
        status: row.status,
        factoryResponse: row.factory_response,
        quotedUnitPrice: row.quoted_unit_price == null ? null : Number(row.quoted_unit_price),
        quotedCurrency: row.quoted_currency,
        promisedShipDate: row.promised_ship_date,
        factoryNote: row.factory_note,
        respondedAt: row.responded_at,
        freshness: freshness?.state ?? "unverified",
        effectiveConfidence: freshness?.effectiveConfidence ?? 0,
      };
    }),
  });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authorized = await authorizeBuyerOrder(id);
  if ("error" in authorized) return authorized.error;

  const { auth, order } = authorized;
  if (!["submitted", "matching"].includes(order.status)) {
    return Response.json({ error: "Order cannot be routed in its current state" }, { status: 409 });
  }

  const admin = createSupabaseAdminClient();
  const { data: rows, error } = await admin
    .from("capacity_slots")
    .select("id,available_units,reserved_units,ends_on,confidence,last_verified_at,updated_at,factories!inner(id,legal_name,verified,product_categories,certifications,indicative_cost_min,indicative_cost_max,on_time_rate,defect_rate)")
    .in("status", ["available", "held"])
    .gte("ends_on", new Date().toISOString().slice(0, 10))
    .eq("factories.verified", true);

  if (error) return Response.json({ error: "Unable to load routing candidates" }, { status: 500 });

  const candidates: RoutingCandidate[] = (rows ?? [])
    .map((row: any) => {
      const factory = Array.isArray(row.factories) ? row.factories[0] : row.factories;
      const freshness = evaluateCapacityFreshness({
        confidence: Number(row.confidence ?? 0),
        lastVerifiedAt: row.last_verified_at ?? null,
        updatedAt: row.updated_at,
      });

      if (!factory?.verified || !isCapacityRoutable(freshness)) return null;

      return {
        factoryId: factory.id,
        factoryName: factory.legal_name,
        capacitySlotId: row.id,
        productCategories: factory.product_categories ?? [],
        certifications: factory.certifications ?? [],
        availableUnits: Math.max(0, row.available_units - row.reserved_units),
        slotEndsOn: row.ends_on,
        indicativeCostMin:
          factory.indicative_cost_min == null ? undefined : Number(factory.indicative_cost_min),
        indicativeCostMax:
          factory.indicative_cost_max == null ? undefined : Number(factory.indicative_cost_max),
        onTimeRate: factory.on_time_rate == null ? undefined : Number(factory.on_time_rate),
        defectRate: factory.defect_rate == null ? undefined : Number(factory.defect_rate),
        capacityConfidence: freshness.effectiveConfidence,
        freshness: freshness.state,
      } as RoutingCandidate & { freshness: string };
    })
    .filter((candidate): candidate is RoutingCandidate & { freshness: string } => candidate !== null);

  const results = routeOrder({
    productCategory: order.product_category,
    quantity: order.quantity,
    targetUnitPrice:
      order.target_unit_price == null ? undefined : Number(order.target_unit_price),
    requiredDeliveryDate: order.required_delivery_date,
    complianceRequirements: order.compliance_requirements ?? [],
  }, candidates);

  const top = results.slice(0, 20);
  let persisted: any[] = [];
  if (top.length > 0) {
    const { data: inserted, error: insertError } = await admin
      .from("order_matches")
      .upsert(
        top.map((result) => ({
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
        })),
        { onConflict: "order_id,factory_id,capacity_slot_id" },
      )
      .select("id,factory_id,capacity_slot_id,status,factory_response,quoted_unit_price,quoted_currency,promised_ship_date,factory_note,responded_at");

    if (insertError) {
      return Response.json({ error: "Unable to persist routing matches" }, { status: 500 });
    }
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

  const persistedByKey = new Map(
    persisted.map((row) => [`${row.factory_id}:${row.capacity_slot_id}`, row]),
  );

  return Response.json({
    matches: top.map((result) => {
      const saved = persistedByKey.get(
        `${result.factoryId}:${result.capacitySlotId ?? null}`,
      );
      return {
        ...result,
        id: saved?.id,
        status: saved?.status ?? "suggested",
        factoryResponse: saved?.factory_response ?? "pending",
        quotedUnitPrice:
          saved?.quoted_unit_price == null ? null : Number(saved.quoted_unit_price),
        quotedCurrency: saved?.quoted_currency ?? null,
        promisedShipDate: saved?.promised_ship_date ?? null,
        factoryNote: saved?.factory_note ?? null,
        respondedAt: saved?.responded_at ?? null,
      };
    }),
  });
}
