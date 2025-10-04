# FlowOTP

A secure Cloudflare Worker for generating TOTP (Time-based One-Time Password) tokens via HTTP.

## Usage

### Configuration

Add your TOTP secrets as environment variables in Cloudflare Workers:

**Variable Format:** `OTP_SECRETS_{IDENTIFIER}`

**Value Format:** `SERVICE_NAME=BASE32_SECRET,SERVICE_NAME2=BASE32_SECRET2,...`

**Example:**
```
OTP_SECRETS_ROIPUBLIC=GitHub=JBSWY3DPEHPK3PXP,AWS=ABCD1234EFGH5678,Google=MNOP9012QRST3456
```

### Endpoint

- **URL Pattern:** `/{identifier}`
- **Method:** `GET`

**Example Request:**
```bash
curl https://2fa.daiquiri.dev/roipublic
```

**Response (JSON Lines format):**
```json
{"service":"GitHub","token":"123456"}
{"service":"AWS","token":"789012"}
{"service":"Google","token":"345678"}
```

## Security

- ✅ Secrets stored in encrypted environment variables (not exposed in URLs)
- ✅ No secrets logged or stored on disk
- ✅ All processing happens within Cloudflare Worker secure environment
- ✅ Multiple services supported with named tokens

## Setup

1. Deploy to Cloudflare Workers
2. Add `OTP_SECRETS` environment variable in Workers settings
3. Access your endpoint to get all TOTP tokens

## Directory Structure

```
functions/
  └── flowotp.js    # Main worker file
README.md
```

## License

MIT
