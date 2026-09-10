import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: order } = await supabase
    .from("orders")
    .select("id,tech_pack_path")
    .eq("id", id)
    .single();

  if (!order) return Response.json({ error: "Order not found or inaccessible" }, { status: 404 });
  if (!order.tech_pack_path) return Response.json({ error: "No tech pack attached" }, { status: 404 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from("tech-packs").createSignedUrl(order.tech_pack_path, 300);
  if (error || !data) return Response.json({ error: "Unable to create download URL" }, { status: 500 });

  return Response.json({ url: data.signedUrl, expiresIn: 300 });
}
