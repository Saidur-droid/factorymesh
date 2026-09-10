import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => null) as { orderId?: string; units?: number } | null;
  const orderId = payload?.orderId;
  const units = Number(payload?.units);
  if (!orderId || !Number.isInteger(units) || units <= 0) {
    return Response.json({ error: "orderId and positive integer units are required" }, { status: 400 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id,buyer_organization_id,quantity,status")
    .eq("id", orderId)
    .single();

  if (!order) return Response.json({ error: "Order not found or inaccessible" }, { status: 404 });
  if (!["submitted", "matching", "reserved"].includes(order.status)) {
    return Response.json({ error: "Order cannot be reserved in its current state" }, { status: 409 });
  }
  if (units > order.quantity) {
    return Response.json({ error: "Reservation exceeds order quantity" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: result, error } = await admin.rpc("reserve_capacity", {
    p_order_id: orderId,
    p_match_id: matchId,
    p_units: units,
  });

  if (error) {
    const conflict = /Insufficient capacity|not reservable/i.test(error.message);
    return Response.json({ error: error.message }, { status: conflict ? 409 : 500 });
  }

  await admin.from("audit_logs").insert({
    actor_user_id: auth.user.id,
    organization_id: order.buyer_organization_id,
    action: "capacity.reserved",
    entity_type: "order",
    entity_id: orderId,
    metadata: { matchId, units },
  });

  return Response.json({ reservation: result }, { status: 201 });
}
