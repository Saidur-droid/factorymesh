import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validation/onboarding";

function slugify(value: string) {
  return `${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = onboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid onboarding data", issues: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const existing = await admin.from("profiles").select("id").eq("id", auth.user.id).maybeSingle();
  if (existing.data) {
    return Response.json({ error: "Account is already onboarded" }, { status: 409 });
  }

  const input = parsed.data;
  const { data: organization, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: input.organizationName,
      slug: slugify(input.organizationName),
      kind: input.role,
      country_code: input.countryCode,
    })
    .select("id")
    .single();

  if (orgError || !organization) {
    return Response.json({ error: "Unable to create organization" }, { status: 500 });
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: auth.user.id,
    full_name: input.fullName,
    role: input.role,
    organization_id: organization.id,
  });

  if (profileError) {
    await admin.from("organizations").delete().eq("id", organization.id);
    return Response.json({ error: "Unable to create profile" }, { status: 500 });
  }

  if (input.role === "factory") {
    const { error: factoryError } = await admin.from("factories").insert({
      organization_id: organization.id,
      legal_name: input.organizationName,
      city: input.city ?? null,
      country_code: input.countryCode,
      product_categories: input.productCategories,
    });

    if (factoryError) {
      await admin.from("profiles").delete().eq("id", auth.user.id);
      await admin.from("organizations").delete().eq("id", organization.id);
      return Response.json({ error: "Unable to create factory profile" }, { status: 500 });
    }
  }

  await admin.from("audit_logs").insert({
    actor_user_id: auth.user.id,
    organization_id: organization.id,
    action: "account.onboarded",
    entity_type: "organization",
    entity_id: organization.id,
    metadata: { role: input.role },
  });

  return Response.json({ ok: true, organizationId: organization.id }, { status: 201 });
}
