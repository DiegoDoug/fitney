// supabase/functions/delete-account/index.ts
// Weight — account deletion Edge Function (FR-SET-03, ADR-0009).
//
// The ONE Edge Function required for MVP. It is the only place a server secret
// (the service-role key) is used; that key is NEVER shipped to the client
// (CON-4). Invoked with the caller's JWT (`verify_jwt = true` in config.toml).
//
// Contract:
//   POST /functions/v1/delete-account
//   headers: Authorization: Bearer <user access token>
//   body:    { "confirm": true }
//   200 ->   { "deleted": true, "receipt_id": "<uuid>", "at": "<iso8601>" }
//   4xx ->   { "deleted": false, "error": "<reason>" }
//
// OQ-10 DECISION (human, 2026-09-02): HARD CASCADE for MVP. Deleting the auth
// user removes `profiles` + every user-owned row via `on delete cascade`
// (schema + 20260902090006 add the missing derived/ledger FKs). No anonymise
// path. The ONLY thing retained is a NON-PII deletion receipt written OUTSIDE
// the user's object graph (`deletion_receipts`): a keyed HMAC of the user id
// (not reversible without the secret), the app version, and timestamps. No
// email, name, or workout data is retained.
//
// RE-AUTH (FR-SET-03): the client must force a fresh sign-in immediately before
// calling this. This function additionally requires the access token to be
// recent AND the account's `last_sign_in_at` to be within REAUTH_MAX_AGE_SECONDS.
// Final policy is owned by security-identity (see docs/security/security-identity.md
// §5 SEC-REQ-AUTH-04).

// SEC-RESID-2 (platform-release, 2026-09-02): pinned to an exact version via
// ./deno.json + ./deno.lock for supply-chain reproducibility. Was an unpinned
// esm.sh import.
import { createClient } from "@supabase/supabase-js";

const REAUTH_MAX_AGE_SECONDS = 300;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return json(405, { deleted: false, error: "method_not_allowed" });
  }

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json(401, { deleted: false, error: "missing_token" });

  let body: { confirm?: boolean };
  try {
    body = await req.json();
  } catch {
    return json(400, { deleted: false, error: "bad_body" });
  }
  if (body.confirm !== true) {
    return json(400, { deleted: false, error: "confirmation_required" });
  }

  // Identify + verify the token against GoTrue.
  const asUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } },
  );
  const { data: userData, error: userErr } = await asUser.auth.getUser();
  if (userErr || !userData.user) {
    return json(401, { deleted: false, error: "invalid_token" });
  }
  const user = userData.user;

  // Freshness: token issued recently AND last sign-in recent.
  const iat = decodeIat(jwt);
  const lastSignIn = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) / 1000 : 0;
  const now = Date.now() / 1000;
  if (
    iat === null ||
    now - iat > REAUTH_MAX_AGE_SECONDS ||
    now - lastSignIn > REAUTH_MAX_AGE_SECONDS
  ) {
    return json(401, { deleted: false, error: "reauth_required" });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const at = new Date().toISOString();

  // 1. Non-PII receipt FIRST (outside the user graph), so a mid-delete failure
  //    still leaves an audit trail. user_ref = keyed HMAC of the user id.
  const userRef = await hmacHex(Deno.env.get("DELETION_RECEIPT_HMAC_KEY")!, user.id);
  const { data: receipt, error: recErr } = await admin
    .from("deletion_receipts")
    .insert({ user_ref: userRef, app_version: req.headers.get("x-app-version") ?? null, requested_at: at, completed_at: at })
    .select("receipt_id")
    .single();
  if (recErr || !receipt) {
    return json(500, { deleted: false, error: "receipt_failed" });
  }

  // 2. Hard cascade: delete the auth user -> every user-owned row cascades.
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    return json(500, { deleted: false, error: "deletion_failed", receipt_id: receipt.receipt_id });
  }

  return json(200, { deleted: true, receipt_id: receipt.receipt_id, at });
});

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// `iat` claim. Signature already verified by getUser() above.
function decodeIat(jwt: string): number | null {
  try {
    const payload = JSON.parse(
      atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof payload.iat === "number" ? payload.iat : null;
  } catch {
    return null;
  }
}

async function hmacHex(keyStr: string, msg: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(keyStr), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
