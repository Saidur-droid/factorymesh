import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  orderId: z.string().uuid(),
  fileName: z.string().min(1).max(180),
  mimeType: z.enum([
    "application/pdf",
    "application/zip",
    "image/png",
    "image/jpeg",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]),
  size: z.number().int().positive().max(25 * 1024 * 1024),
});

function safeName(value: string) {
  const cleaned = value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  return cleaned.slice(-120) || "tech-pack";
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid upload request" }, { status: 400 });

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
    return Response.json({ error: "This account cannot upload buyer tech packs" }, { status: 403 });
  }
  if (profile.role === "buyer" && profile.organization_id !== order.buyer_organization_id) {
    return Response.json({ error: "Order does not belong to this buyer organization" }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const path = `${order.buyer_organization_id}/${order.id}/${crypto.randomUUID()}-${safeName(parsed.data.fileName)}`;
  const { data, error } = await admin.storage.from("tech-packs").createSignedUploadUrl(path, { upsert: false });
  if (error || !data) return Response.json({ error: "Unable to create upload URL" }, { status: 500 });

  return Response.json({ path, token: data.token, mimeType: parsed.data.mimeType });
}
