# AuthFlow

A self-hosted TOTP management platform built with **Next.js 16**, **Auth.js v5**, and **PostgreSQL**.

## Features

- **Web Dashboard:** Add and manage TOTP services from any browser.
- **REST API:** Fetch OTP codes programmatically with a master API key.
- **Slack Integration:** `/otp <service-slug>` posts the current code to any Slack channel.
- **Analytics:** Per-service request logs and 7-day usage charts.
- **Self-hosted:** Deploy to Vercel in minutes. Bring your own PostgreSQL database.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No database required in development — a mock session is used automatically.

## Environment Variables

Create a `.env.local` file (never commit this):

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=your-random-secret
API_KEY=your-api-key
SLACK_SIGNING_SECRET=your-slack-signing-secret   # optional
```

## API Usage

```http
GET /{service-slug}?key=YOUR_API_KEY
GET /{service-slug}?key=YOUR_API_KEY&raw=true
```

## Slack Integration

See **Settings → Slack Integration** in the dashboard for setup instructions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router) |
| Auth | Auth.js v5 |
| Database | PostgreSQL (`postgres` driver) |
| OTP | Web Crypto API (RFC 6238) |
| UI | shadcn/ui + Tailwind CSS 4 |

## Deployment

Designed for **Vercel** with a **Supabase** (or any PostgreSQL) database.

Required environment variables: `DATABASE_URL`, `AUTH_SECRET`, `API_KEY`

## Roadmap

- [x] TOTP Dashboard
- [x] REST API with master key
- [x] Slack slash command integration
- [x] Per-service analytics
- [ ] Docker image for self-hosting
- [ ] Request attribution (track who requested each token)
- [ ] Secret rotation
- [ ] Hardware key support (YubiKey)

---

Developed by [daiquiridev](https://github.com/daiquiridev).
