/**
 * Secure session storage for Supabase Auth tokens (SPEC §6.1 AUTH-02, ADR-0009).
 * Tokens live ONLY in expo-secure-store (OS keychain / keystore), never in the
 * SQLite file or plain AsyncStorage. On verified sign-out / account deletion the
 * caller also drops the per-user local DB.
 *
 * expo-secure-store values are capped at 2048 bytes; a Supabase session can
 * exceed that, so it is chunked.
 */
import * as SecureStore from 'expo-secure-store';

const CHUNK = 2000;

async function setChunked(key: string, value: string): Promise<void> {
  const parts = Math.ceil(value.length / CHUNK);
  await SecureStore.setItemAsync(`${key}::parts`, String(parts));
  for (let i = 0; i < parts; i++) {
    await SecureStore.setItemAsync(`${key}::${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
  }
}

async function getChunked(key: string): Promise<string | null> {
  const partsRaw = await SecureStore.getItemAsync(`${key}::parts`);
  if (!partsRaw) return null;
  const parts = Number(partsRaw);
  let out = '';
  for (let i = 0; i < parts; i++) {
    const piece = await SecureStore.getItemAsync(`${key}::${i}`);
    if (piece == null) return null;
    out += piece;
  }
  return out;
}

async function removeChunked(key: string): Promise<void> {
  const partsRaw = await SecureStore.getItemAsync(`${key}::parts`);
  const parts = partsRaw ? Number(partsRaw) : 0;
  for (let i = 0; i < parts; i++) await SecureStore.deleteItemAsync(`${key}::${i}`);
  await SecureStore.deleteItemAsync(`${key}::parts`);
}

export const secureSessionStorage = {
  getItem: (key: string) => getChunked(key),
  setItem: (key: string, value: string) => setChunked(key, value),
  removeItem: (key: string) => removeChunked(key),
};
