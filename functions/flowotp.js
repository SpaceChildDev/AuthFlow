export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

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

    // Extract identifier from path (e.g., /roipublic -> roipublic)
    const identifier = path.startsWith('/') ? path.slice(1) : path;

    if (!identifier) {
      return new Response(JSON.stringify({ error: "No identifier provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get secrets for this identifier from environment
    // Expected format: OTP_SECRETS_ROIPUBLIC=GitHub=SECRET1,AWS=SECRET2
    const envKey = `OTP_SECRETS_${identifier.toUpperCase()}`;
    const secretsEnv = env[envKey] || "";

    if (!secretsEnv) {
      return new Response(JSON.stringify({ error: "No OTP secrets configured for this identifier" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const secrets = {};
    secretsEnv.split(',').forEach(pair => {
      const [name, secret] = pair.split('=');
      if (name && secret) {
        secrets[name.trim()] = secret.trim();
      }
    });

    if (Object.keys(secrets).length === 0) {
      return new Response(JSON.stringify({ error: "Invalid OTP_SECRETS format" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Generate tokens for all configured services
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
};
