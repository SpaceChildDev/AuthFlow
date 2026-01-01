/**
 * Robust Base32 to Uint8Array decoder
 */
export function base32ToUint8Array(base32) {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanBase32 = base32.replace(/=+$/, "").replace(/\s/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const len = cleanBase32.length;
  const out = new Uint8Array((len * 5) / 8 | 0);
  let index = 0;

  for (let i = 0; i < len; i++) {
    const val = base32chars.indexOf(cleanBase32[i]);
    if (val === -1) throw new Error("Invalid base32 character");
    
    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      out[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return out;
}

/**
 * Generates TOTP token and its metadata
 */
export async function generateTOTP(secret, digits = 6, period = 30, algorithm = "SHA-1") {
  const keyBytes = base32ToUint8Array(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / period);
  const secondsRemaining = period - (epoch % period);
  
  const timeBytes = new Uint8Array(8);
  let tempCounter = BigInt(counter);
  for (let i = 7; i >= 0; i--) {
    timeBytes[i] = Number(tempCounter & 0xffn);
    tempCounter >>= 8n;
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: algorithm },
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

  const otp = (binary % Math.pow(10, digits)).toString().padStart(digits, '0');
  
  return {
    token: otp,
    seconds_remaining: secondsRemaining,
    expires_at: (counter + 1) * period,
    algorithm,
    digits,
    period
  };
}

/**
 * Common response headers including CORS
 */
export const commonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};
