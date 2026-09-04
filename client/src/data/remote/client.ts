/**
 * The ONE place the Supabase client is constructed (CON-4/CON-5, ADR-0002).
 * Only the publishable/anon key + project URL are bundled — never a service-role
 * key. Auth tokens persist via the expo-secure-store adapter (session-storage.ts).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { secureSessionStorage } from './session-storage';

function readExtra(key: string): string {
  const v =
    (Constants.expoConfig?.extra as Record<string, string> | undefined)?.[key] ??
    process.env[`EXPO_PUBLIC_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`];
  if (!v) throw new Error(`missing client config: ${key}`);
  return v;
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = readExtra('supabaseUrl');
  const anonKey = readExtra('supabaseAnonKey');
  client = createClient(url, anonKey, {
    auth: {
      storage: secureSessionStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}
