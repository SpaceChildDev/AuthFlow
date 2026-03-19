# AuthFlow — Gemini Brief: Radix UI Branch

Bu dosya Gemini'ye projeyi tanıtmak ve `radix` branch'inde yapılacak işleri açıklamak için yazılmıştır.

---

## Proje Nedir?

**AuthFlow** — kişisel bir TOTP (Time-based One-Time Password) yönetim platformu.

Kullanıcı dashboard üzerinden "servis" ekler (GitHub, AWS, Cloudflare vb.), her servis için otomatik TOTP kodu üretilir ve webhook URL'si oluşturulur. Bu URL n8n, CI/CD, Slack bot gibi otomasyon araçlarıyla kullanılır.

**Live:** `https://authflow.spacechild.dev`
**Repo:** `https://github.com/daiquiridev/AuthFlow`
**Branch:** `main` (şu an aktif, production)

---

## Mevcut Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16.2.0 (App Router) |
| Runtime | Node.js Serverless (Vercel) |
| Auth | Auth.js v5 beta (next-auth@5) — Credentials + JWT |
| Database | Supabase PostgreSQL (postgres npm paketi, pgbouncer pooler) |
| UI | Shadcn UI (Radix UI tabanlı ama custom config) + Tailwind CSS v4 |
| Deploy | Vercel (prod domain: authflow.spacechild.dev) |
| Middleware | Next.js 16 proxy pattern (`src/proxy.ts`) |

---

## Proje Dosya Yapısı

```
src/
├── app/
│   ├── [service]/route.ts          # Public TOTP API endpoint (GET /{slug}?key=API_KEY)
│   ├── api/
│   │   ├── auth/[...nextauth]/     # Auth.js handler
│   │   ├── register/route.ts       # POST /api/register (sign up)
│   │   ├── me/apikey/route.ts      # GET /api/me/apikey (returns API_KEY to authed users)
│   │   ├── services/route.ts       # POST /api/services (create)
│   │   ├── services/[id]/route.ts  # PATCH/DELETE /api/services/[id]
│   │   └── account/
│   │       ├── password/route.ts   # POST /api/account/password (change password)
│   │       └── delete/route.ts     # DELETE /api/account/delete
│   ├── dashboard/
│   │   ├── page.tsx                # Overview (service count, log count)
│   │   ├── services/page.tsx       # Services table (DataTable)
│   │   ├── analytics/page.tsx      # Chart (7-day request history)
│   │   └── settings/page.tsx       # Profile, password change, theme, delete account
│   ├── login/page.tsx
│   └── layout.tsx                  # ThemeProvider + SessionProvider wrapping
├── components/
│   ├── data-table.tsx              # Services table with CRUD actions
│   ├── add-service-dialog.tsx      # Dialog: add new service
│   ├── edit-service-dialog.tsx     # Dialog: edit existing service
│   ├── login-form.tsx              # Sign in / Sign up form
│   ├── nav-user.tsx                # Sidebar user menu (logout)
│   ├── app-sidebar.tsx             # Main sidebar
│   ├── site-header.tsx             # Top header bar
│   ├── section-cards.tsx           # Overview stat cards
│   ├── chart-area-interactive.tsx  # Recharts area chart
│   ├── theme-toggle.tsx            # Dark/light mode toggle (next-themes)
│   └── session-provider.tsx        # next-auth SessionProvider wrapper
├── lib/
│   ├── auth.ts                     # NextAuth config (Credentials provider)
│   ├── auth.config.ts              # JWT/session callbacks (edge-safe)
│   ├── db.ts                       # postgres client (Supabase pooler)
│   ├── totp.ts                     # TOTP generation (Web Crypto API)
│   └── utils.ts                    # cn() utility
├── types/
│   └── next-auth.d.ts              # Session type extension (user.id)
└── proxy.ts                        # Next.js 16 middleware (auth guard for /dashboard)
```

---

## Veritabanı Şeması (Supabase PostgreSQL)

```sql
-- Kullanıcılar (Auth.js Credentials ile yönetilen, Supabase Auth DEĞİL)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,  -- bcryptjs hash
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TOTP Servisleri
CREATE TABLE otp_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,          -- "GitHub"
  slug TEXT NOT NULL,          -- "github" (URL'de kullanılır)
  secret TEXT NOT NULL,        -- Base32 TOTP secret
  digits INTEGER DEFAULT 6,
  step INTEGER DEFAULT 30,     -- saniye
  algorithm TEXT DEFAULT 'SHA-1',
  encoding TEXT DEFAULT 'base32',
  access_token TEXT,           -- NULL = public slug, doluysa private URL token
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API İstek Logları
CREATE TABLE otp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES otp_services(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
AUTH_SECRET=<32+ karakter random string>
API_KEY=<webhook auth key>
```

---

## Temel Özellikler & Akış

### Auth Akışı
1. `/login` → Sign up veya Sign in (email + password)
2. Sign up: `POST /api/register` → bcrypt hash → users tablosuna insert
3. Sign in: Auth.js Credentials provider → bcrypt compare → JWT session
4. `src/proxy.ts` middleware `/dashboard/**` rotalarını korur
5. Session: JWT (DB'de session tablosu yok)

### TOTP API Akışı
```
GET /github?key=API_KEY&raw=true
→ API key kontrolü
→ otp_services tablosundan slug veya access_token ile lookup
→ TOTP üret (Web Crypto API, SHA-1/256/512)
→ otp_logs'a async log yaz
→ { token: "123456", seconds_remaining: 23 } veya düz text
```

### Private URL Özelliği
- Servis oluştururken "Private URL" seçilirse `access_token` (random hex) üretilir
- Webhook URL: `/{access_token}?key=API_KEY` (slug değil)
- Rotatable: her "Rotate" işleminde yeni token

---

## Yapılan Değişiklikler (Claude ile — main branch)

### Supabase → Neon/PostgreSQL Migrasyonu (Gemini yaptı, Claude düzeltti)
- Supabase Auth tamamen kaldırıldı → Auth.js v5 Credentials + JWT
- `@supabase/ssr` ve `@supabase/supabase-js` kaldırıldı
- `postgres` npm paketi ile doğrudan PostgreSQL bağlantısı
- Middleware `src/proxy.ts` olarak yeniden yapılandırıldı (Next.js 16)

### Claude Düzeltmeleri (son session)

#### Güvenlik Düzeltmeleri
- `API_KEY` artık server component prop'u olarak client'a geçilmiyor
  - Eskisi: `<DataTable apiKey={process.env.API_KEY} />` → HTML'e gömülüyordu
  - Yenisi: `GET /api/me/apikey` endpoint'i → auth kontrollü, sadece oturum açıklara döner
- Tüm servis API route'larına input validation eklendi (boş alan, digit range, step range)
- Slug uniqueness kontrolü eklendi (aynı user duplicate slug oluşturamaz)

#### Kırık Özellikler Düzeltildi
- **Theme Toggle**: `next-themes` ThemeProvider entegre edildi, `ThemeToggle` component oluşturuldu
- **Change Password**: `/api/account/password` endpoint'i oluşturuldu (mevcut şifre doğrulama + bcrypt)
- **Delete Account**: `/api/account/delete` endpoint'i oluşturuldu (cascade, signOut redirect)
- **Nav User menüsü**: İşlevsiz Account/Billing/Notifications öğeleri kaldırıldı
- **Forgot password linki**: `href="#"` yerine bilgilendirici metin
- **Documentation butonu**: İşlevsiz buton header'dan kaldırıldı

#### UX Düzeltmeleri
- `window.location.reload()` → `router.refresh()` (data-table'da 3 yerde)
- Türkçe string'ler İngilizce yapıldı (toast mesajları, confirm dialog'lar)
- Analytics: client-side log filtrelemesi → SQL GROUP BY (performans)
- `[service]/route.ts`'ten `export const runtime = 'edge'` kaldırıldı (postgres paketi edge'de çalışmıyor)

---

## Mevcut Eksikler / Bilinen Limitler

- Şifre sıfırlama (email yok, email provider entegrasyonu yapılmamış)
- Rate limiting yok (API endpoint'lerinde brute-force koruması yok)
- Analytics sadece son 7 gün gösteriyor (hardcoded)
- `section-cards.tsx` içindeki stat rakamları dummy/hardcoded kısımlar var
- `chart-area-interactive.tsx` bazı kısımlar placeholder

---

## Radix Branch Görevi

**Amaç:** Mevcut Shadcn/UI bağımlılıklarını kaldırıp saf Radix UI primitive'leri ile yeniden oluşturmak.

### Yapılacaklar

```bash
git checkout -b radix main
```

1. **Shadcn component'larını kaldır** (`src/components/ui/` klasörü)
2. **Radix UI primitive'lerini doğrudan kur:**
   ```bash
   npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
   npm install @radix-ui/react-select @radix-ui/react-label
   npm install @radix-ui/react-separator @radix-ui/react-slot
   npm install @radix-ui/react-tabs @radix-ui/react-avatar
   npm install @radix-ui/react-tooltip @radix-ui/react-checkbox
   npm install @radix-ui/react-toggle @radix-ui/react-toggle-group
   ```
3. **Tailwind class'larını doğrudan Radix bileşenlerine uygula**
4. **Mevcut component API'larını koru** (prop isimleri, children yapısı)
   - `data-table.tsx`, `add-service-dialog.tsx`, `edit-service-dialog.tsx` vb. dosyalar **değişmeyecek**
   - Sadece `src/components/ui/` altındaki wrapper'lar değişecek
5. **`components.json` ve `shadcn` konfigürasyonunu kaldır**
6. **Build test et:** `npm run build`

### Korunacak Dosyalar (dokunma)
- `src/app/**` (tüm sayfalar ve API route'lar)
- `src/lib/**`
- `src/proxy.ts`
- `src/types/**`
- `src/components/data-table.tsx`
- `src/components/add-service-dialog.tsx`
- `src/components/edit-service-dialog.tsx`
- `src/components/login-form.tsx`
- `src/components/nav-user.tsx`
- `src/components/app-sidebar.tsx`
- `src/components/site-header.tsx`
- `src/components/section-cards.tsx`
- `src/components/chart-area-interactive.tsx`
- `src/components/theme-toggle.tsx`
- `src/components/session-provider.tsx`
- `src/components/bmc-button.tsx`

### Değişecek Dosyalar
- `src/components/ui/**` — tümü yeniden yazılacak
- `components.json` — silinecek
- `package.json` — shadcn CLI dependency kaldırılacak (varsa)

---

## Gemini'ye Özel Notlar

- `src/proxy.ts` = Next.js 16'da middleware dosyası. Normal `middleware.ts` değil, `proxy.ts` kullanılıyor.
- Auth session'a `user.id` eklemek için `src/types/next-auth.d.ts` type extension dosyası var.
- `postgres` paketi Supabase pgbouncer pooler ile kullanılıyor, `prepare: false` zorunlu.
- `db.ts`'te `?pgbouncer=true` URL parametresi strip ediliyor (postgres paketi bunu desteklemiyor).
- Tüm dashboard sayfaları server component, sadece settings client component (`useSession` kullanıyor).
- `data-table.tsx` API key'i mount'ta `fetch('/api/me/apikey')` ile alıyor.
