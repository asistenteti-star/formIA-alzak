import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Faltan variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local"
  );
}

// Cliente público — usa la anon/publishable key.
// Solo puede INSERTAR en `respuestas` por la política RLS.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

// Cliente administrativo — usa service_role key (solo en server).
// Bypass de RLS para SELECT/UPDATE/DELETE en /admin.
export function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY (solo servidor)");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
