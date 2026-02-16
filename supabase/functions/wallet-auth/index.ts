import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const JWT_SECRET = Deno.env.get("SUPABASE_JWT_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Base58 alphabet used by Solana */
const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function decodeBase58(input: string): Uint8Array {
  const bytes: number[] = [0];
  for (const char of input) {
    const value = BASE58_ALPHABET.indexOf(char);
    if (value === -1) throw new Error(`Invalid base58 character: ${char}`);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = bytes[i] * 58 + value;
      if (bytes[i] > 255) {
        if (i + 1 >= bytes.length) bytes.push(0);
        bytes[i + 1] += (bytes[i] >> 8);
        bytes[i] &= 0xff;
      }
    }
  }
  // Count leading '1's for leading zero bytes
  let leadingZeros = 0;
  for (const char of input) {
    if (char === "1") leadingZeros++;
    else break;
  }
  const result = new Uint8Array(leadingZeros + bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    result[leadingZeros + bytes.length - 1 - i] = bytes[i];
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

/** Verify ed25519 signature using Web Crypto */
async function verifyEd25519(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array,
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      publicKey,
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify("Ed25519", key, signature, message);
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

    const isValid = await verifyEd25519(
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
