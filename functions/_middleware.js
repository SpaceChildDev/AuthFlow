export async function onRequest(context) {
  const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    // Security check - verify API key
    const apiKey = request.headers.get('X-API-Key') || url.searchParams.get('key');
    const validApiKey = env.API_KEY;

    if (!validApiKey || apiKey !== validApiKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // TOTP helper functions
    function base32toHex(base32) {
      const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      let bits = "", hex = "";
      for (let i = 0; i < base32.length; i++) {
        const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
        bits += val.toString(2).padStart(5, '0');
      }
      for (let i = 0; i + 4 <= bits.length; i += 4) {
        hex += parseInt(bits.substr(i, 4), 2).toString(16);
      }
      return hex;
    }

    async function generateTOTP(secret) {
      const key = base32toHex(secret);
      const epoch = Math.floor(Date.now() / 1000);
      const time = Math.floor(epoch / 30).toString(16).padStart(16, '0');
      const timeBytes = Uint8Array.from(time.match(/.{1,2}/g).map(b => parseInt(b, 16)));
      const keyBytes = Uint8Array.from(key.match(/.{1,2}/g).map(b => parseInt(b, 16)));

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );

      const hmac = await crypto.subtle.sign('HMAC', cryptoKey, timeBytes);
      const hmacBytes = new Uint8Array(hmac);

      const offset = hmacBytes[hmacBytes.length - 1] & 0xf;
      const binary = (
        ((hmacBytes[offset] & 0x7f) << 24) |
        ((hmacBytes[offset + 1] & 0xff) << 16) |
        ((hmacBytes[offset + 2] & 0xff) << 8) |
        (hmacBytes[offset + 3] & 0xff)
      );

      const otp = (binary % 1000000).toString().padStart(6, '0');
      return otp;
    }

    // Extract path segments
    const pathSegments = path.split('/').filter(s => s);

    if (pathSegments.length === 0 || pathSegments.length > 2) {
      return new Response(JSON.stringify({ error: "Invalid path. Use /{identifier} or /{identifier}/{service}" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const identifier = pathSegments[0];
    const service = pathSegments[1]; // optional

    // Case 1: Single service request (/roi/shopify-mcc)
    if (service) {
      const envKey = service.toUpperCase().replace(/-/g, '_');
      const secret = env[envKey];

      if (!secret) {
        return new Response(JSON.stringify({ error: `No secret configured: ${envKey}` }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      try {
        const token = await generateTOTP(secret);
        return new Response(JSON.stringify({ service, token }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to generate token" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Case 2: All services for identifier (/roi)
    // Get all environment variables (excluding API_KEY and Cloudflare built-ins)
    const secrets = {};
    const excludedKeys = ['API_KEY', 'CF_PAGES', 'CF_PAGES_BRANCH', 'CF_PAGES_COMMIT_SHA', 'CF_PAGES_URL', 'ASSETS'];

    for (const key in env) {
      if (!excludedKeys.includes(key) && !key.startsWith('CF_')) {
        const serviceName = key.toLowerCase().replace(/_/g, '-');
        secrets[serviceName] = env[key];
      }
    }

    if (Object.keys(secrets).length === 0) {
      return new Response(JSON.stringify({ error: `No secrets configured` }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Generate tokens for all services
    const tokens = [];
    for (const [name, secret] of Object.entries(secrets)) {
      try {
        const token = await generateTOTP(secret);
        tokens.push({ service: name, token });
      } catch (error) {
        tokens.push({ service: name, error: "Failed to generate token" });
      }
    }

    return new Response(tokens.map(t => JSON.stringify(t)).join('\n'), {
      headers: { "Content-Type": "application/json" }
    });
}
