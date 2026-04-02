import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// Service role client — full access, used in Edge Functions only
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Anon client factory — creates a client scoped to the user's JWT
export function createUserClient(authHeader: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });
}

// Extract user ID from auth header via Supabase
export async function getUser(authHeader: string) {
  const client = createUserClient(authHeader);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  return user;
}
