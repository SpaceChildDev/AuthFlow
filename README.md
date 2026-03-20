# AuthFlow

A self-hosted TOTP management platform. Generate, manage, and audit one-time passwords from a web dashboard — with a Slack slash command for team use.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5-purple)](https://authjs.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-compatible-blue?logo=postgresql)](https://www.postgresql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**[Live Demo →](https://demo.authflow.spacechild.dev)** &nbsp;|&nbsp; **[Production](https://authflow.spacechild.dev)**

> Demo login: `demo@authflow.dev` / `demo` — no data is stored, write actions are disabled.

## Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Add, edit, and manage TOTP services. Live countdown timers. |
| **REST API** | `GET /{slug}?key=API_KEY` — integrate with any automation tool. |
| **Slack** | `/otp <slug>` posts the current code to the channel. |
| **Attribution** | Every request logged with source (API / Slack) and requester. |
| **Analytics** | 7-day usage chart + full request history in the dashboard. |
| **Self-hosted** | Runs on Vercel. Any PostgreSQL database works. |

## Quick Start

```bash
git clone https://github.com/daiquiridev/AuthFlow.git
cd AuthFlow
npm install
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard). In development, no database or login is needed — a mock session is used automatically.

## Environment Variables

Create `.env.local` (never commit this file):

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/dbname
AUTH_SECRET=any-long-random-string

# API access key — used to authenticate GET /{slug}?key=...
API_KEY=your-secret-api-key

# Optional — required only for Slack integration
SLACK_SIGNING_SECRET=your-slack-signing-secret
```

## Database Setup

Run the migrations in your PostgreSQL database (Supabase SQL editor or `psql`):

```bash
# Apply all migrations in order
psql $DATABASE_URL -f supabase/migrations/20260101000000_initial_schema.sql
psql $DATABASE_URL -f supabase/migrations/20260320000000_add_attribution_to_logs.sql
```

> **Note:** The initial schema references `auth.users` (Supabase). If you're using raw PostgreSQL, replace this with your own `users` table reference.

## API

### Get an OTP code

```http
GET /{service-slug}?key=YOUR_API_KEY
```

```http
GET /{service-slug}?key=YOUR_API_KEY&raw=true
```

Returns JSON by default. With `raw=true`, returns a plain-text token — useful for shell scripts.

**Example:**
```bash
curl https://authflow.spacechild.dev/google-ads?key=YOUR_API_KEY&raw=true
# → 482931
```

**Response (JSON):**
```json
{
  "token": "482931",
  "seconds_remaining": 18,
  "expires_at": 1742500830,
  "digits": 6,
  "step": 30,
  "algorithm": "SHA-1"
}
```

You can also pass the key via header:
```http
X-API-Key: YOUR_API_KEY
```

## Slack Integration

After setup, anyone in your workspace can type:

```
/otp google-ads
/otp github
```

The current OTP is posted to the channel, visible to everyone. No per-user authentication — designed for shared team accounts.

**Setup:** See **Settings → Slack Integration** in the dashboard for step-by-step instructions.

## Request Attribution

Every OTP request is logged with:
- **Source** — `slack` or `api`
- **Requested by** — Slack username, or `api-key` for REST calls
- **Service** — which service was queried
- **Timestamp**

Visible in **Analytics → Recent Requests**.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16.2](https://nextjs.org) — App Router |
| Auth | [Auth.js v5](https://authjs.dev) — Credentials provider |
| Database | PostgreSQL via [`postgres`](https://github.com/porsager/postgres) driver |
| OTP | Web Crypto API — RFC 6238, no third-party OTP libraries |
| UI | [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS 4 |
| Deployment | [Vercel](https://vercel.com) |

## Deployment

1. Fork this repo
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Run database migrations
5. Deploy

Required env vars for production: `DATABASE_URL`, `AUTH_SECRET`, `API_KEY`

## Roadmap

- [x] TOTP dashboard
- [x] REST API with master key
- [x] Slack slash command integration
- [x] Request attribution (source + requester)
- [x] 7-day analytics chart
- [ ] Docker image for self-hosting
- [ ] Secret rotation
- [ ] Hardware key support (YubiKey)

## License

MIT — see [LICENSE](LICENSE).

---

Developed by [daiquiridev](https://github.com/daiquiridev) · [Live demo](https://demo.authflow.spacechild.dev) · [Production](https://authflow.spacechild.dev)
