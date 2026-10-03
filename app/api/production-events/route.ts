import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productionEventSchema } from "@/lib/validation/production";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = productionEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid production event", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id,buyer_organization_id,assigned_factory_id,status")
    .eq("id", parsed.data.orderId)
    .single();

  if (!order?.assigned_factory_id) {
    return Response.json({ error: "Order is not assigned to a factory" }, { status: 409 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id,role")
    .eq("id", auth.user.id)
    .single();

  if (!profile) return Response.json({ error: "Profile missing" }, { status: 403 });

  const { data: assignedFactory } = await supabase
    .from("factories")
    .select("organization_id")
    .eq("id", order.assigned_factory_id)
    .single();

  const mayWrite = profile.role === "operator" || profile.role === "admin" || assignedFactory?.organization_id === profile.organization_id;
  if (!mayWrite) return Response.json({ error: "You cannot update this order" }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("production_events")
    .insert({
      order_id: parsed.data.orderId,
      factory_id: order.assigned_factory_id,
      event_type: parsed.data.eventType,
      progress_percent: parsed.data.progressPercent ?? null,
      payload: parsed.data.payload,
      created_by: auth.user.id,
    })
    .select("id,occurred_at")
    .single();

  if (error) return Response.json({ error: "Unable to record production event" }, { status: 500 });

  const nextStatus = parsed.data.eventType === "production.started"
    ? "in_production"
    : parsed.data.eventType.startsWith("qc.")
      ? "qc"
      : parsed.data.eventType === "shipment.dispatched"
        ? "shipped"
        : null;

  if (nextStatus) await admin.from("orders").update({ status: nextStatus }).eq("id", parsed.data.orderId);
  await admin.from("audit_logs").insert({
    actor_user_id: auth.user.id,
    organization_id: profile.organization_id,
    action: parsed.data.eventType,
    entity_type: "order",
    entity_id: parsed.data.orderId,
    metadata: { progressPercent: parsed.data.progressPercent ?? null },
  });

  return Response.json({ event: data }, { status: 201 });
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const orderId = new URL(request.url).searchParams.get("orderId");
  if (!orderId) return Response.json({ error: "orderId is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("production_events")
    .select("id,event_type,occurred_at,progress_percent,payload,factory_id")
    .eq("order_id", orderId)
    .order("occurred_at", { ascending: false })
    .limit(200);

  if (error) return Response.json({ error: "Unable to load production events" }, { status: 500 });
  return Response.json({ events: data });
}
