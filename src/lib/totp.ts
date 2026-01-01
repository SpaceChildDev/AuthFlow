/**
 * Parses otpauth:// URIs to extract TOTP parameters including label and issuer
 */
export function parseOtpAuthUri(uri: string) {
  try {
    const cleanUri = uri.trim();
    if (!cleanUri.startsWith('otpauth://')) return null;
    
    const url = new URL(cleanUri);
    if (url.host !== 'totp') return null;

    // Path is usually /Issuer:Account or /Account
    const path = decodeURIComponent(url.pathname.substring(1));
    let name = path;
    let issuer = url.searchParams.get('issuer');

    if (path.includes(':')) {
      const parts = path.split(':');
      issuer = parts[0].trim();
      name = `${parts[0].trim()} (${parts[1].trim()})`;
    } else if (issuer) {
      name = `${issuer} (${path})`;
    }

    const secret = url.searchParams.get('secret');
    const digits = url.searchParams.get('digits') || '6';
    const period = url.searchParams.get('period') || '30';
    const algorithm = (url.searchParams.get('algorithm') || 'SHA1').toUpperCase().replace('SHA', 'SHA-');

    return {
      name,
      secret,
      digits,
      step: period,
      algorithm: ['SHA-1', 'SHA-256', 'SHA-512'].includes(algorithm) ? algorithm : 'SHA-1'
    };
  } catch (e) {
    return null;
  }
}

/**
 * Robust Base32 to Uint8Array decoder
 */
function base32ToUint8Array(base32: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = base32.replace(/[^A-Z2-7]/gi, "").toUpperCase();
  
  let bits = 0;
  let value = 0;
  const output = new Uint8Array((cleaned.length * 5) / 8 | 0);
  let index = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const val = alphabet.indexOf(cleaned[i]);
    if (val === -1) continue;
    
    value = (value << 5) | val;
    bits += 5;

    while (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return output;
}

function hexToUint8Array(hex: string): Uint8Array {
  const cleaned = hex.replace(/[^0-9A-Fa-f]/g, "");
  const output = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    output[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  return output;
}

/**
 * Generates TOTP token using Web Crypto API
 */
export async function generateTOTP(
  inputSecret: string, 
  digits = 6, 
  step = 30, 
  algorithm = 'SHA-1', 
  encoding = 'base32'
) {
  let secret = inputSecret;
  let finalDigits = digits;
  let finalStep = step;
  let finalAlgorithm = algorithm.toUpperCase().replace('SHA', 'SHA-');
  
  if (!['SHA-1', 'SHA-256', 'SHA-512'].includes(finalAlgorithm)) {
    finalAlgorithm = 'SHA-1';
  }

  const parsed = parseOtpAuthUri(inputSecret);
  if (parsed) {
    secret = parsed.secret || inputSecret;
    finalDigits = parseInt(parsed.digits);
    finalStep = parseInt(parsed.step);
    finalAlgorithm = parsed.algorithm;
  }

  const keyBytes = encoding === 'hex' ? hexToUint8Array(secret) : base32ToUint8Array(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / finalStep);
  
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setBigUint64(0, BigInt(counter), false);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes as BufferSource,
    { name: 'HMAC', hash: finalAlgorithm },
    false,
    ['sign']
  );

  const hmac = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
  const hmacBytes = new Uint8Array(hmac);

  const offset = hmacBytes[hmacBytes.length - 1] & 0xf;
  const binary = (
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff)
  );

  const token = (binary % Math.pow(10, finalDigits)).toString().padStart(finalDigits, '0');
  
  return {
    token,
    seconds_remaining: finalStep - (epoch % finalStep),
    expires_at: (counter + 1) * finalStep,
    digits: finalDigits,
    step: finalStep,
    algorithm: finalAlgorithm
  };
}
