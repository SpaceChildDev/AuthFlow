import { generateTOTP, commonHeaders } from "./_utils.js";

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
  if (typeof value !== "string" || value.trim().length < 16) return false;
  
  const sanitized = value.trim().toUpperCase().replace(/\s+/g, "").replace(/=+$/, "");
  const forbiddenKeys = ["API_KEY", "ASSETS", "KV_FLOWOTP"]; // Add KV binding name here if needed

  return (
    /^[A-Z0-9_]+$/.test(key) &&
    !key.startsWith("CF_") &&
    !forbiddenKeys.includes(key) &&
    /^[A-Z2-7]*$/.test(sanitized)
  );
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: commonHeaders });
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);
  const providedKey = request.headers.get("X-API-Key") || url.searchParams.get("key");
  const validApiKey = env.API_KEY;

  if (!validApiKey || providedKey !== validApiKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: commonHeaders
    });
  }

  const digits = parseInt(url.searchParams.get("digits")) || 6;
  const isRaw = url.searchParams.get("raw") === "true";
  
  // Service name can come from path (/service) or query (?s=service or ?service=service)
  const pathService = pathSegments[0] === "tools" && pathSegments[1] === "flowotp" ? pathSegments[2] : pathSegments[0];
  const actualService = pathService || url.searchParams.get("s") || url.searchParams.get("service");

  // 1. If a specific service is requested
  if (actualService) {
    const envKey = toEnvKey(actualService);
    let secret = env[envKey];

    // Try KV if not in ENV
    if (!secret && env.KV_FLOWOTP) {
      secret = await env.KV_FLOWOTP.get(envKey);
    }

    // Direct secret support (if actualService itself is a 16+ char secret)
    if (!secret && actualService.length >= 16 && /^[A-Z2-7]+$/i.test(actualService)) {
      secret = actualService;
    }

    if (!secret) {
      return new Response(JSON.stringify({ error: `No secret configured for: ${actualService}` }), {
        status: 404,
        headers: commonHeaders
      });
    }

    try {
      const result = await generateTOTP(secret, digits);
      
      if (isRaw) {
        return new Response(result.token, {
          headers: { ...commonHeaders, "Content-Type": "text/plain" }
        });
      }

      return new Response(JSON.stringify(result), {
        headers: commonHeaders
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: commonHeaders
      });
    }
  }

  // 2. If no specific service, list all tokens from ENV
  // Note: listing all from KV might be slow/not feasible depending on volume, 
  // so we stick to ENV for the "list all" feature unless specifically requested.
  const tokens = {};
  for (const [key, value] of Object.entries(env)) {
    if (isCandidateSecret(key, value)) {
      try {
        const serviceName = toCanonicalName(key);
        tokens[serviceName] = await generateTOTP(value, digits);
      } catch (e) {
        // Skip failed ones
      }
    }
  }

  if (Object.keys(tokens).length === 0) {
    return new Response(JSON.stringify({ error: "No secrets configured" }), {
      status: 404,
      headers: commonHeaders
    });
  }

  return new Response(JSON.stringify(tokens), {
    headers: commonHeaders
  });
}
