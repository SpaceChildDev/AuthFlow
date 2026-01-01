# AuthFlow V2 (Dashboard)

A full-stack TOTP management platform built with **Next.js 15**, **Shadcn UI**, and **Tailwind CSS**.

## Features

- **Dynamic Dashboard:** Manage all your TOTP secrets from a modern UI.
- **Full-Stack API:** Robust backend endpoints for automation (n8n, CI/CD).
- **Edge Performance:** Optimized for deployment on Cloudflare Pages or Vercel.
- **Highly Secure:** Ready for encrypted database storage (Supabase/Prisma).

## Quick Start

--- 

## Deployment (Dokploy / Docker)

AuthFlow is now Docker-ready for self-hosting on **Dokploy**.

### Step 1: Prepare Dokploy
1.  Create a new **Project** named `AuthFlow`.
2.  Create a new **Application** within the project.
3.  Set the **Source** to your GitHub repository and `ui` branch.

### Step 2: Build Configuration
Dokploy will automatically detect the `Dockerfile`. Ensure the following:
-   **Port:** `3000`
-   **Environment Variables:**
    -   `NEXT_PUBLIC_SUPABASE_URL`
    -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    -   `API_KEY`

### Step 3: Deploy
Click **Deploy** in the Dokploy dashboard. Your instance will be built and served as a standalone Node.js application.

---

## Local Development

```bash
# Install dependencies
npm install

# Run the app
npm run dev
```

### Environment Configuration

Create a `.env.local` file:
```env
API_KEY=your-secret-api-key
GITHUB=JBSWY3DPEHPK3PXP...
AWS=MNOP9012QRST3456...
```

## Webhook Integration

Fetch tokens directly for your automations:

```http
GET /{service-name}?key=YOUR_API_KEY&raw=true
```

--- 

## Roadmap (Planned Features)

We are constantly improving AuthFlow. Here is what's coming next:

- [ ] **Native Chat Integrations:** Direct connection to **Slack**, **Discord**, and **Telegram** without needing n8n. Example: `/otp my-service-name` to get a token instantly.
- [ ] **Request Attribution:** Track exactly *who* (which Slack user or API Key) requested each token.
- [ ] **Secret Rotation:** Automatically rotate Base32 secrets for supported services.
- [ ] **Hardware Key Support:** Support for physical security keys (YubiKey) to access the dashboard.
- [ ] **Advanced Encryption:** Bring-your-own-key (BYOK) for veritabanı encryption.

---

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com)
- **TOTP Logic:** Custom Web Crypto Implementation
- **Icons:** [Lucide React](https://lucide.dev)

---
Developed by [spacechild-dev](https://github.com/spacechild-dev).
