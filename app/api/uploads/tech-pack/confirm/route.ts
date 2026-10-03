import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ orderId: z.string().uuid(), path: z.string().min(10).max(500) });

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid confirmation" }, { status: 400 });

  const [{ data: order }, { data: profile }] = await Promise.all([
    supabase
      .from("orders")
      .select("id,buyer_organization_id")
      .eq("id", parsed.data.orderId)
      .single(),
    supabase
      .from("profiles")
      .select("organization_id,role")
      .eq("id", auth.user.id)
      .single(),
  ]);
  if (!order) return Response.json({ error: "Order not found or inaccessible" }, { status: 404 });
  if (!profile || !["buyer", "operator", "admin"].includes(profile.role)) {
    return Response.json({ error: "This account cannot attach buyer tech packs" }, { status: 403 });
  }
  if (profile.role === "buyer" && profile.organization_id !== order.buyer_organization_id) {
    return Response.json({ error: "Order does not belong to this buyer organization" }, { status: 403 });
  }

  if (!parsed.data.path.startsWith(`${order.buyer_organization_id}/${order.id}/`)) {
    return Response.json({ error: "Upload path does not belong to this order" }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { data: object, error: objectError } = await admin.storage.from("tech-packs").list(`${order.buyer_organization_id}/${order.id}`, {
    search: parsed.data.path.split("/").pop(),
    limit: 5,
  });
  if (objectError || !object?.some((item) => parsed.data.path.endsWith(`/${item.name}`))) {
    return Response.json({ error: "Uploaded object was not found" }, { status: 409 });
  }

  const { error } = await admin.from("orders").update({ tech_pack_path: parsed.data.path }).eq("id", order.id);
  if (error) return Response.json({ error: "Unable to attach tech pack" }, { status: 500 });

  await admin.from("audit_logs").insert({
    actor_user_id: auth.user.id,
    organization_id: order.buyer_organization_id,
    action: "order.tech_pack_attached",
    entity_type: "order",
    entity_id: order.id,
    metadata: { path: parsed.data.path },
  });

  return Response.json({ ok: true });
}
