const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store, max-age=0"
};

function toEnvKey(segment = "") {
  return segment
    .replace(/[^0-9a-z]+/gi, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();
}

function toCanonicalName(value = "") {
  return value
    .toLowerCase()
    .replace(/[^0-9a-z]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isCandidateSecret(key, value) {
  const sanitized =
    typeof value === "string"
      ? value.trim().toUpperCase().replace(/\s+/g, "").replace(/=+$/, "")
      : "";

  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    /^[A-Z0-9_]+$/.test(key) &&
    !key.startsWith("CF_") &&
    key !== "API_KEY" &&
    key !== "ASSETS" &&
    /^[A-Z2-7]*$/.test(sanitized) &&
    sanitized.length >= 16
  );
}

function base32ToUint8Array(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const sanitized = secret
    .toUpperCase()
    .replace(/=+$/, "")
    .replace(/\s+/g, "");

  if (sanitized.length === 0) {
    throw new Error("Secret is empty");
  }

  let bits = "";
  for (const char of sanitized) {
    const value = alphabet.indexOf(char);
    if (value === -1) {
      throw new Error("Invalid Base32 character in secret");
    }
    bits += value.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return new Uint8Array(bytes);
}

async function generateTOTP(secret, step = 30, digits = 6) {
  const counter = Math.floor(Date.now() / 1000 / step);
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setUint32(4, counter);

  const counterBytes = new Uint8Array(counterBuffer);
  const keyBytes = base32ToUint8Array(secret);

  if (keyBytes.length === 0) {
    throw new Error("Secret is not a valid Base32 string");
  }

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, counterBytes));
  const offset = hmac[hmac.length - 1] & 0xf;

  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (binary % 10 ** digits).toString().padStart(digits, "0");
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathSegments = url.pathname.split("/").filter(Boolean);

  const providedKey = request.headers.get("X-API-Key");
  const queryKey = url.searchParams.get("key");
  const validApiKey = env.API_KEY;

  if (!validApiKey || (providedKey ?? queryKey) !== validApiKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: JSON_HEADERS
    });
  }

  if (pathSegments.length > 2) {
    return new Response(JSON.stringify({ error: "Invalid path" }), {
      status: 400,
      headers: JSON_HEADERS
    });
  }

  const serviceSegment = pathSegments.length === 2 ? pathSegments[1] : undefined;

  if (serviceSegment) {
    const envKey = toEnvKey(serviceSegment);
    const secret = env[envKey];
    const serviceName = toCanonicalName(serviceSegment);

    if (!serviceName) {
      return new Response(JSON.stringify({ error: "Invalid service name" }), {
        status: 400,
        headers: JSON_HEADERS
      });
    }

    if (!secret) {
      return new Response(JSON.stringify({ error: `No secret configured: ${envKey}` }), {
        status: 404,
        headers: JSON_HEADERS
      });
    }

    try {
      const token = await generateTOTP(secret);
      return new Response(JSON.stringify({ [serviceName]: token }), {
        headers: JSON_HEADERS
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to generate token" }), {
        status: 500,
        headers: JSON_HEADERS
      });
    }
  }

  const tokens = {};

  for (const [key, value] of Object.entries(env)) {
    if (!isCandidateSecret(key, value)) {
      continue;
    }

    try {
      const serviceName = toCanonicalName(key);
      if (!serviceName) {
        continue;
      }
      tokens[serviceName] = await generateTOTP(value);
    } catch (error) {
      return new Response(JSON.stringify({ error: `Failed to generate token: ${key}` }), {
        status: 500,
        headers: JSON_HEADERS
      });
    }
  }

  if (Object.keys(tokens).length === 0) {
    return new Response(JSON.stringify({ error: "No secrets configured" }), {
      status: 404,
      headers: JSON_HEADERS
    });
  }

  return new Response(JSON.stringify(tokens), {
    headers: JSON_HEADERS
  });
}
