# FlowOTP

A secure Cloudflare Worker for generating TOTP (Time-based One-Time Password) tokens via HTTP.

## Usage

### Configuration

Add your TOTP secrets as **encrypted environment variables** in Cloudflare Workers/Pages:

**Variable Format:** `{IDENTIFIER}_{SERVICE}`

**Example:**
```
ROIPUBLIC_SHOPIFY_MCC=JBSWY3DPEHPK3PXP
ROIPUBLIC_GITHUB=ABCD1234EFGH5678
ROIPUBLIC_AWS_CONSOLE=MNOP9012QRST3456
```

Each variable should be added as an **encrypted secret** in Cloudflare Dashboard.

### Endpoint

- **URL Pattern:** `/{identifier}/{service}`
- **Method:** `GET`

**Example Request:**
```bash
curl https://2fa.daiquiri.dev/roipublic/shopify-mcc
```

**Response:**
```json
{"service":"shopify-mcc","token":"123456"}
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
