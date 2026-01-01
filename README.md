# FlowOTP

A secure and minimalist Cloudflare Pages Function for generating TOTP (Time-based One-Time Password) tokens via HTTP.

## Features

- **Multi-Service Support:** Manage multiple TOTP secrets easily.
- **Secure Storage:** Store secrets in Cloudflare Environment Variables or KV.
- **Detailed Metadata:** Returns `token`, `seconds_remaining`, and `expires_at`.
- **CORS Support:** Integrated for browser-based tools.
- **API Key Security:** Protected by `X-API-Key` header or query parameter.

## Usage

### Configuration

Add your TOTP secrets as **encrypted environment variables** or in **Cloudflare KV**:

**Required:**
`API_KEY` (e.g., `7KmN9pQrS2tUvW8xYz3aB5cDe6fGhJ4L`)

**Environment Variables:** Use uppercase and underscores (e.g., `SHOPIFY_MCC`).
**Cloudflare KV:** Create a KV namespace and bind it as `KV_FLOWOTP`. Store keys in uppercase (e.g., `GITHUB`).

### Endpoints

**1. Generate specific token:**
- `GET /[service-name]?key=[API_KEY]`
- `GET /?s=[service-name]&key=[API_KEY]`

**2. Generate all configured tokens (ENV only):**
- `GET /?key=[API_KEY]`

### Optional Parameters

- `digits`: Number of digits (default: 6).
- `raw`: Set to `true` to get only the token string (text/plain) instead of JSON.

**Example (n8n friendly):**
```http
GET https://flow-otp.pages.dev/?s=github&key=your-key&raw=true
```
**Response:** `123456`

### Integration with n8n

You can use the **HTTP Request** node in n8n to fetch tokens dynamically:

1.  **Method:** GET
2.  **URL:** `https://your-app.pages.dev/{{$node["Set Service"].json["service_name"]}}`
3.  **Parameters:** Add `key` with your `API_KEY`.
4.  **Conditional Logic:** Use n8n's **Switch** or **If** nodes to decide which service name to pass to the URL.

**Response:**
```json
{
  "token": "123456",
  "seconds_remaining": 24,
  "expires_at": 1704067230
}
```

## Security

- ✅ API Key authentication required.
- ✅ Secrets are never stored in the URL.
- ✅ All processing happens within Cloudflare's secure environment.

## License

MIT