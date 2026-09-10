import { createSupabaseServerClient } from "@/lib/supabase/server";
import { capacitySlotSchema } from "@/lib/validation/capacity";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("capacity_slots")
    .select("id,factory_id,starts_on,ends_on,line_type,product_category,available_units,reserved_units,status,confidence,source,updated_at")
    .gte("ends_on", new Date().toISOString().slice(0, 10))
    .order("starts_on", { ascending: true })
    .limit(500);

  if (error) return Response.json({ error: "Unable to load capacity" }, { status: 500 });
  return Response.json({ capacity: data });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = capacitySlotSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid capacity slot", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id,role")
    .eq("id", auth.user.id)
    .single();

  if (!profile?.organization_id || !["factory", "operator", "admin"].includes(profile.role)) {
    return Response.json({ error: "Factory account required" }, { status: 403 });
  }

  const { data: factory } = await supabase
    .from("factories")
    .select("id")
    .eq("organization_id", profile.organization_id)
    .single();

  if (!factory) return Response.json({ error: "Factory profile missing" }, { status: 409 });

  const input = parsed.data;
  const { data, error } = await supabase
    .from("capacity_slots")
    .insert({
      factory_id: factory.id,
      starts_on: input.startsOn,
      ends_on: input.endsOn,
      line_type: input.lineType ?? null,
      product_category: input.productCategory,
      available_units: input.availableUnits,
      confidence: input.confidence,
      source: input.source,
    })
    .select("id,status,created_at")
    .single();

  if (error) return Response.json({ error: "Unable to publish capacity" }, { status: 500 });
  return Response.json({ capacity: data }, { status: 201 });
}
