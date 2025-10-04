# FlowOTP

A secure Cloudflare Worker for generating TOTP (Time-based One-Time Password) tokens via HTTP.

## Usage

### Configuration

Add your TOTP secrets as **encrypted environment variables** in Cloudflare Workers/Pages:

**Required:**
```
API_KEY=7KmN9pQrS2tUvW8xYz3aB5cDe6fGhJ4L
```

**Variable Format:** `{SERVICE}` (use underscores, not dashes)

**Example:**
```
API_KEY=7KmN9pQrS2tUvW8xYz3aB5cDe6fGhJ4L
SHOPIFY_MCC=CSTF6TWZ5A37WNXUUMTWMDND63V5LCWS
GITHUB=JBSWY3DPEHPK3PXP
AWS_CONSOLE=MNOP9012QRST3456
```

**Note:** Cloudflare only accepts uppercase letters, numbers, and underscores in variable names (e.g., `SHOPIFY_MCC`). The worker automatically converts those names to dashed lowercase (e.g., `shopify-mcc`) in responses and URLs.

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
{"shopify-mcc":"123456"}
```

**Option 2: All services**
- **URL Pattern:** `/{any}` (identifier doesn't matter, returns all)
- **Method:** `GET`

**Example:**
```bash
curl -H "X-API-Key: 7KmN9pQrS2tUvW8xYz3aB5cDe6fGhJ4L" https://2fa.daiquiri.dev/roi
```

**Response (JSON Object):**
```json
{
  "shopify-mcc": "123456",
  "github": "789012",
  "aws-console": "345678"
}
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
