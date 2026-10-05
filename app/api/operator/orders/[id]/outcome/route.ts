import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canOperateTrustState } from "@/lib/operations/verification";
import {
  calculateFactoryOutcomeMetrics,
  classifyDeliveryOutcome,
} from "@/lib/outcomes/memory";

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
  const actualShipDate = typeof body?.actualShipDate === "string" ? body.actualShipDate : "";
  const defectRate = Number(body?.defectRate);
  const realizedUnitPrice =
    body?.realizedUnitPrice == null || body.realizedUnitPrice === ""
      ? null
      : Number(body.realizedUnitPrice);
  const currency = String(body?.currency ?? "USD").trim().toUpperCase();
  const notes = typeof body?.notes === "string" ? body.notes.trim() || null : null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(actualShipDate)) {
    return Response.json({ error: "A valid actual ship date is required" }, { status: 400 });
  }
  if (!Number.isFinite(defectRate) || defectRate < 0 || defectRate > 100) {
    return Response.json({ error: "Defect rate must be between 0 and 100" }, { status: 400 });
  }
  if (realizedUnitPrice != null && (!Number.isFinite(realizedUnitPrice) || realizedUnitPrice <= 0)) {
    return Response.json({ error: "Realized unit price must be positive" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id,assigned_factory_id,required_delivery_date,status,currency")
    .eq("id", id)
    .single();

  if (!order?.assigned_factory_id) {
    return Response.json({ error: "Assigned order required" }, { status: 409 });
  }
  if (!["shipped", "completed"].includes(order.status)) {
    return Response.json({ error: "Shipment must be dispatched before recording outcome" }, { status: 409 });
  }

  const onTime = classifyDeliveryOutcome(order.required_delivery_date, actualShipDate);
  const { data: outcome, error } = await admin
    .from("order_outcomes")
    .upsert({
      order_id: order.id,
      factory_id: order.assigned_factory_id,
      required_delivery_date: order.required_delivery_date,
      actual_ship_date: actualShipDate,
      on_time: onTime,
      defect_rate: defectRate,
      realized_unit_price: realizedUnitPrice,
      currency: currency || order.currency,
      notes,
      recorded_by: auth.user.id,
    }, { onConflict: "order_id" })
    .select("id,order_id,factory_id,actual_ship_date,on_time,defect_rate,realized_unit_price,currency,created_at,updated_at")
    .single();

  if (error || !outcome) {
    return Response.json({ error: "Unable to record outcome" }, { status: 500 });
  }

  const { data: samples, error: samplesError } = await admin
    .from("order_outcomes")
    .select("on_time,defect_rate")
    .eq("factory_id", order.assigned_factory_id);

  if (samplesError) {
    return Response.json({ error: "Outcome recorded but metrics could not be recalculated" }, { status: 500 });
  }

  const metrics = calculateFactoryOutcomeMetrics(
    (samples ?? []).map((sample) => ({
      onTime: Boolean(sample.on_time),
      defectRate: Number(sample.defect_rate),
    })),
  );

  const { data: factory } = await admin
    .from("factories")
    .select("metadata")
    .eq("id", order.assigned_factory_id)
    .single();

  await Promise.all([
    admin
      .from("factories")
      .update({
        on_time_rate: metrics.onTimeRate,
        defect_rate: metrics.defectRate,
        metadata: {
          ...(factory?.metadata ?? {}),
          outcome_sample_size: metrics.sampleSize,
          outcome_metrics_updated_at: new Date().toISOString(),
        },
      })
      .eq("id", order.assigned_factory_id),
    admin
      .from("orders")
      .update({ status: "completed" })
      .eq("id", order.id),
    admin.from("audit_logs").insert({
      actor_user_id: auth.user.id,
      organization_id: profile.organization_id,
      action: "order.outcome_recorded",
      entity_type: "order",
      entity_id: order.id,
      metadata: {
        factoryId: order.assigned_factory_id,
        onTime,
        defectRate,
        realizedUnitPrice,
        sampleSize: metrics.sampleSize,
      },
    }),
  ]);

  return Response.json({ outcome, metrics });
}
