# FlowOTP

A secure Cloudflare Worker for generating TOTP (Time-based One-Time Password) tokens via HTTP.

## Usage

### Configuration

Add your TOTP secrets as **encrypted environment variables** in Cloudflare Workers/Pages:

**Required:**
```
API_KEY=7KmN9pQrS2tUvW8xYz3aB5cDe6fGhJ4L
```

**Variable Format:** `{SERVICE}` (service name with dashes becomes underscores)

**Example:**
```
API_KEY=7KmN9pQrS2tUvW8xYz3aB5cDe6fGhJ4L
SHOPIFY_MCC=CSTF6TWZ5A37WNXUUMTWMDND63V5LCWS
GITHUB=JBSWY3DPEHPK3PXP
AWS_CONSOLE=MNOP9012QRST3456
```

Each variable should be added as an **encrypted secret** in Cloudflare Dashboard.

### Endpoints

**Option 1: Single service**
- **URL Pattern:** `/{identifier}/{service}`
- **Method:** `GET`

**Example:**
```bash
curl -H "X-API-Key: 7KmN9pQrS2tUvW8xYz3aB5cDe6fGhJ4L" https://2fa.daiquiri.dev/roi/shopify-mcc
# or with query param:
curl https://2fa.daiquiri.dev/roi/shopify-mcc?key=7KmN9pQrS2tUvW8xYz3aB5cDe6fGhJ4L
```

**Response:**
```json
{"service":"shopify-mcc","token":"123456"}
```

**Option 2: All services**
- **URL Pattern:** `/{any}` (identifier doesn't matter, returns all)
- **Method:** `GET`

**Example:**
```bash
curl -H "X-API-Key: 7KmN9pQrS2tUvW8xYz3aB5cDe6fGhJ4L" https://2fa.daiquiri.dev/roi
```

**Response (JSON Lines):**
```json
{"service":"shopify-mcc","token":"123456"}
{"service":"github","token":"789012"}
{"service":"aws-console","token":"345678"}
```

## Security

- ✅ API Key authentication (header or query parameter)
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
