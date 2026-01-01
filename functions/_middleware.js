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
  const step = parseInt(url.searchParams.get("step")) || 30;
  const algo = (url.searchParams.get("algo") || "SHA-1").toUpperCase().replace("SHA", "SHA-");
  const isRaw = url.searchParams.get("raw") === "true";
  
  // 1. Get Secret (Priority: Query Param > Path Secret > Service Lookup)
  let secret = url.searchParams.get("secret");
  const pathService = pathSegments[0] === "tools" && pathSegments[1] === "flowotp" ? pathSegments[2] : pathSegments[0];
  const serviceName = url.searchParams.get("s") || url.searchParams.get("service") || pathService;

  // If no direct secret in query, check if path segment is a secret or a service name
  if (!secret && serviceName) {
    // Check registered services (ENV then KV)
    const envKey = toEnvKey(serviceName);
    secret = env[envKey];

    if (!secret && env.KV_FLOWOTP) {
      secret = await env.KV_FLOWOTP.get(envKey);
    }

    // If still no secret, check if the serviceName itself is a direct secret (length check)
    if (!secret && serviceName.length >= 16 && /^[A-Z2-7]+$/i.test(serviceName)) {
      secret = serviceName;
    }
  }

  // 2. Process Token if secret found
  if (secret) {
    try {
      const result = await generateTOTP(secret, digits, step, algo);
      
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

  // 3. If no specific secret/service, and it's root, list all from ENV (List Mode)
  if (!pathService && !url.searchParams.has("s")) {
    const tokens = {};
    for (const [key, value] of Object.entries(env)) {
      if (isCandidateSecret(key, value)) {
        try {
          const sName = toCanonicalName(key);
          tokens[sName] = await generateTOTP(value, digits, step, algo);
        } catch (e) {}
      }
    }

    if (Object.keys(tokens).length > 0) {
      return new Response(JSON.stringify(tokens), {
        headers: commonHeaders
      });
    }
  }

  return new Response(JSON.stringify({ error: "No secret or service provided." }), {
    status: 400,
    headers: commonHeaders
  });
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
