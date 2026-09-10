import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function createSupabaseAdminClient() {
  const secret = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) is required for privileged server operations");
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
