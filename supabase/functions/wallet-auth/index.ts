import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import nacl from "https://esm.sh/tweetnacl@1.0.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const JWT_SECRET = Deno.env.get("JWT_SECRET") ?? Deno.env.get("SUPABASE_JWT_SECRET") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Base58 alphabet used by Solana */
const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function decodeBase58(input: string): Uint8Array {
  // Count leading '1's (zero bytes in base58)
  let leadingZeros = 0;
  for (let i = 0; i < input.length && input[i] === "1"; i++) leadingZeros++;

  // Allocate enough space for the decoded bytes
  const size = Math.ceil(input.length * Math.log(58) / Math.log(256));
  const bytes = new Uint8Array(size);

  for (const char of input) {
    let carry = BASE58_ALPHABET.indexOf(char);
    if (carry === -1) throw new Error(`Invalid base58 character: ${char}`);
    // Apply "value = value * 58 + carry" across all bytes (big-endian)
    for (let j = size - 1; j >= 0; j--) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
  }

  // Skip leading zero bytes from the conversion
  let start = 0;
  while (start < size && bytes[start] === 0) start++;

  // Prepend the leading zero bytes from the input
  const result = new Uint8Array(leadingZeros + (size - start));
  for (let i = start; i < size; i++) {
    result[leadingZeros + i - start] = bytes[i];
  }
  return result;
}

/** Base64url encode without padding */
function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Create a HS256 JWT using Web Crypto */
async function createJWT(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encoder = new TextEncoder();

  const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64url(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signingInput),
  );

  const signatureB64 = base64url(new Uint8Array(signature));
  return `${signingInput}.${signatureB64}`;
}

/** Verify ed25519 signature using tweetnacl (pure JS, no Web Crypto dependency) */
function verifyEd25519(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array,
): boolean {
  try {
    if (publicKey.length !== 32 || signature.length !== 64) return false;
    return nacl.sign.detached.verify(message, signature, publicKey);
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { wallet_address, message, signature } = await req.json();

    if (!wallet_address || !message || !signature) {
      return jsonResponse(
        { error: "Missing wallet_address, message, or signature" },
        400,
      );
    }

    // 1. Verify the ed25519 signature
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = decodeBase58(signature);
    const publicKeyBytes = decodeBase58(wallet_address);

    const isValid = verifyEd25519(
      messageBytes,
      signatureBytes,
      publicKeyBytes,
    );

    if (!isValid) {
      return jsonResponse({ error: "Invalid signature" }, 401);
    }

    // 2. Verify the SIWS message contains the wallet address
    if (!message.includes(wallet_address)) {
      return jsonResponse(
        { error: "Message does not match wallet address" },
        401,
      );
    }

    // 3. Create or fetch user via service role client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", wallet_address)
      .single();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          wallet_address,
          genesis_token_type: "seeker",
          genesis_token_mint: "pending",
        })
        .select("id")
        .single();

      if (insertError || !newUser) {
        return jsonResponse(
          {
            error:
              "Failed to create user: " +
              (insertError?.message ?? "unknown"),
          },
          500,
        );
      }
      userId = newUser.id;
    }

    // 4. Generate Supabase-compatible JWT
    const now = Math.floor(Date.now() / 1000);
    const accessToken = await createJWT(
      {
        sub: userId,
        aud: "authenticated",
        role: "authenticated",
        iss: "supabase",
        iat: now,
        exp: now + 60 * 60 * 24 * 7, // 7 days
        wallet_address,
      },
      JWT_SECRET,
    );

    const refreshToken = crypto.randomUUID();

    return jsonResponse({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
      expires_in: 60 * 60 * 24 * 7,
      user_id: userId,
    });
  } catch (error) {
    console.error("wallet-auth error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
