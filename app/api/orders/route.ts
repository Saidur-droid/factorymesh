import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productionBriefSchema } from "@/lib/validation/order";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = productionBriefSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid production brief", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", auth.user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    return Response.json({ error: "Buyer organization not configured" }, { status: 403 });
  }

  if (!['buyer','operator','admin'].includes(profile.role)) {
    return Response.json({ error: "This account cannot create production briefs" }, { status: 403 });
  }

  const input = parsed.data;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .insert({
      buyer_organization_id: profile.organization_id,
      created_by: auth.user.id,
      title: input.title,
      product_category: input.productCategory,
      quantity: input.quantity,
      target_unit_price: input.targetUnitPrice ?? null,
      currency: input.currency,
      required_delivery_date: input.requiredDeliveryDate,
      ship_to_country_code: input.shipToCountryCode ?? null,
      material_requirements: input.materialRequirements ?? null,
      compliance_requirements: input.complianceRequirements,
      status: "submitted",
      notes: input.notes ?? null,
    })
    .select("id, status, created_at")
    .single();

  if (error) {
    return Response.json({ error: "Unable to create production brief" }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_user_id: auth.user.id,
    organization_id: profile.organization_id,
    action: "order.created",
    entity_type: "order",
    entity_id: data.id,
  });

  return Response.json({ order: data }, { status: 201 });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id,title,product_category,quantity,status,required_delivery_date,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return Response.json({ error: "Unable to load orders" }, { status: 500 });
  return Response.json({ orders: data });
}
