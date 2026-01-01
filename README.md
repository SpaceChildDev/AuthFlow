# AuthFlow 🛡️

**AuthFlow** is a secure, serverless, and minimalist API designed to generate **Time-based One-Time Passwords (TOTP)** at the edge. Built on Cloudflare Pages Functions, it provides an ultra-fast way to automate 2FA/MFA requirements in CI/CD pipelines, automation tools like n8n, or browser-based dashboards.

---

## 🚀 Overview

In today's automation-heavy world, many services require 2FA. **AuthFlow** acts as a secure bridge, allowing you to fetch current TOTP tokens via simple HTTP requests. It eliminates the need for manual token entry during automated tasks, without ever compromising security by exposing secrets in client-side code.

- **Fast:** Runs on Cloudflare's global edge network.
- **Secure:** Secrets are stored in encrypted Environment Variables or Cloudflare KV.
- **Minimalist:** Zero dependencies, lightweight footprint.
- **Versatile:** Supports custom algorithms, digits, and time steps.

---

## 🧠 Technical Know-How

### How TOTP Works in AuthFlow
AuthFlow implements the **RFC 6238** standard. The core logic involves:
1.  **Base32 Decoding:** The secret key is decoded into a byte array.
2.  **Time Counter:** Calculating the number of time steps (default 30s) since the Unix epoch.
3.  **HMAC-SHA1:** Creating a keyed-hash using the time counter and the secret.
4.  **Dynamic Truncation:** Extracting a 6-digit (default) code from the hash.

AuthFlow leverages the **Web Crypto API** (`crypto.subtle`) available in the Cloudflare Workers runtime, ensuring high-performance cryptographic operations without external libraries.

---

## 🚀 Deployment (How to Install)

### Step 1: Deploy to Cloudflare Pages
1.  **Fork or Clone** this repository to your GitHub account.
2.  Go to the **Cloudflare Dashboard** > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3.  Select the `AuthFlow` repository.
4.  **Build settings:**
    *   **Framework preset:** None
    *   **Build command:** Leave empty (or `npm run build` if you add one later)
    *   **Build output directory:** `/` (root)
5.  Click **Save and Deploy**.

### Step 2: Configure Secrets
1.  In your Pages project, go to **Settings** > **Functions** > **Environment variables**.
2.  Add `API_KEY` (Your master password for the API).
3.  Add your service secrets (e.g., `GITHUB = JBSWY3D...`).
4.  *Optional:* Create a KV Namespace named `KV_AUTHFLOW` and bind it under **Settings** > **Functions** > **KV namespace bindings**.

### Step 3: Custom Domain
1.  Go to **Custom domains** in your Pages project settings.
2.  Add `authflow.daiquiri.dev`.
3.  Cloudflare will automatically handle the DNS and SSL certificate.

---

## 💻 Local Development

Run AuthFlow on your machine for testing:

```bash
# 1. Install dependencies
npm install

# 2. Start local server (uses Wrangler)
npm run dev
```
Local endpoint: `http://localhost:8788`

---

## 📡 API Reference

**Base URL:** `https://authflow.daiquiri.dev`

### 🔒 Authentication
All requests require an API Key, provided via:
- Header: `X-API-Key: your-api-key`
- Query Param: `?key=your-api-key`

### 1. Service Mode (Registered Secrets)
Fetch a token for a pre-configured service.
- **URL:** `/{service-name}`
- **Query:** `?s={service-name}`

### 2. Direct Mode (Ad-hoc)
Generate a token from a secret provided in the request.
- **URL:** `/{base32-secret}`
- **Query:** `?secret={base32-secret}`

### 🧪 Parameters
| Parameter | Default | Description |
| :--- | :--- | :--- |
| `digits` | `6` | Length of the generated code. |
| `step` | `30` | Time step in seconds. |
| `algo` | `SHA-1` | Algorithm (`SHA-1`, `SHA-256`, `SHA-512`). |
| `raw` | `false` | If `true`, returns only the token as `text/plain`. |

---

## 💡 Usage Scenarios

### Scenario A: n8n Automation (Workflow MFA)
Automate logging into a service that requires 2FA within an n8n flow.
- **Node:** HTTP Request
- **URL:** `https://authflow.daiquiri.dev/my-service?key={{$env.AUTH_FLOW_KEY}}&raw=true`
- **Result:** Use the output directly in your login form automation.

### Scenario B: CI/CD Pipeline (Automated Testing)
Bypass manual 2FA entry during E2E tests (Cypress/Playwright).
```bash
TOKEN=$(curl -s "https://authflow.daiquiri.dev/staging-env?key=${AUTH_FLOW_KEY}&raw=true")
# Use $TOKEN to fill the 2FA input
```

### Scenario C: Centralized Team Dashboard
Build a private internal dashboard where team members can see current 2FA codes for shared tools without sharing the actual Base32 secrets.
- Use **AuthFlow** with JSON output to show token + `seconds_remaining` for a better UI experience.

---

## 🔍 SEO & Metadata
- **Keywords:** TOTP API, MFA Automation, Cloudflare Workers 2FA, n8n TOTP integration, serverless OTP generator, Edge Computing Auth, RFC 6238 API.
- **Description:** A high-performance, secure API for generating TOTP tokens at the edge. Perfect for automation, n8n, and CI/CD workflows.

---

## 📄 License
MIT License. Created with ❤️ by [spacechild-dev](https://github.com/spacechild-dev).
