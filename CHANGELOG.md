# Changelog

## [Unreleased] — radix branch
- Shadcn/UI → saf Radix UI primitive'leri ile yeniden yazım

---

## [2.0.0] — 2026-03-20 (main, production)

### Büyük Değişiklik: Supabase → Auth.js v5 + PostgreSQL

**Önceki stack:** Next.js 15 + Supabase Auth + Supabase DB + Cloudflare Pages
**Yeni stack:** Next.js 16 + Auth.js v5 + Supabase PostgreSQL (raw) + Vercel

#### Eklenenler
- Auth.js v5 (`next-auth@beta`) — Credentials provider, JWT session
- `postgres` npm paketi — doğrudan PostgreSQL bağlantısı
- `bcryptjs` — şifre hashing
- `src/lib/auth.ts` — NextAuth konfigürasyonu
- `src/lib/auth.config.ts` — Edge-safe JWT/session callbacks
- `src/lib/db.ts` — Supabase pgbouncer pooler bağlantısı
- `src/types/next-auth.d.ts` — session.user.id type extension
- `src/proxy.ts` — Next.js 16 middleware (auth guard)
- `src/app/api/register/route.ts` — kullanıcı kaydı
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js handler
- `src/app/api/services/route.ts` — servis oluşturma
- `src/app/api/services/[id]/route.ts` — servis güncelleme/silme
- `src/app/api/me/apikey/route.ts` — auth'lu API key endpoint'i
- `src/app/api/account/password/route.ts` — şifre değiştirme
- `src/app/api/account/delete/route.ts` — hesap silme
- `src/components/theme-toggle.tsx` — dark/light mode toggle
- `src/components/session-provider.tsx` — SessionProvider wrapper
- Veritabanı: `users`, `otp_services`, `otp_logs` tabloları

#### Kaldırılanlar
- `@supabase/ssr`, `@supabase/supabase-js`
- `@cloudflare/next-on-pages`
- `wrangler.toml`
- `src/lib/supabase.ts`, `src/lib/supabase-server.ts`
- `src/app/auth/callback/route.ts`
- `package.json` → `build:cloudflare` script

#### Değiştirilenler
- `src/middleware.ts` → `src/proxy.ts` (Next.js 16 pattern)
- Tüm dashboard sayfaları Supabase client → Auth.js `auth()` + raw SQL
- `src/components/login-form.tsx` → `signIn()` from `next-auth/react`
- `src/components/add-service-dialog.tsx` → `fetch('/api/services')`
- `src/components/edit-service-dialog.tsx` → `fetch('/api/services/[id]')`
- `src/components/data-table.tsx` → `fetch('/api/services/[id]')`
- `src/components/nav-user.tsx` → `signOut()` from `next-auth/react`
- `next` 15.1.0 → 16.2.0
- `react` 19.0.0 → 19.2.4

---

## [2.0.1] — 2026-03-20 (main, production)

### Güvenlik & Bug Düzeltmeleri (Claude Code session)

#### Güvenlik
- **[CRITICAL] API_KEY server props'tan kaldırıldı**
  - `services/page.tsx`: `apiKey={process.env.API_KEY}` prop'u kaldırıldı
  - `data-table.tsx`: API key artık `fetch('/api/me/apikey')` ile alınıyor (auth-gated)
  - Eskiden API key React props üzerinden HTML'e gömülüyordu

- **Input validation eklendi** (`/api/services` ve `/api/services/[id]`)
  - Zorunlu alan kontrolü: `name`, `slug`, `secret`
  - `digits`: 6-8 arası zorunlu
  - `step`: 15-300 saniye arası zorunlu
  - `slug`: otomatik lowercase + alfanumerik normalize

- **Slug uniqueness kontrolü**
  - Aynı kullanıcı aynı slug ile iki servis oluşturamaz
  - Güncelleme sırasında kendi slug'ına çakışma kontrolü (kendisi hariç)

#### Düzeltilen Bug'lar

- **`src/proxy.ts`**: `export const proxy = auth` → `export default auth`
  - Next.js 16 middleware default export gerektiriyor, named export çalışmıyordu

- **`src/lib/db.ts`**: `?pgbouncer=true` URL parametresi strip ediliyor
  - `postgres` paketi bu parametreyi PostgreSQL startup parametresi olarak gönderiyordu, bağlantı hatası veriyordu

- **`src/app/[service]/route.ts`**: `export const runtime = 'edge'` kaldırıldı
  - `postgres` paketi TCP kullandığından edge runtime'da çalışmıyor

#### Kırık Özellikler Düzeltildi

- **Theme Toggle** (Settings sayfası)
  - `next-themes` ThemeProvider `layout.tsx`'e eklendi
  - `src/components/theme-toggle.tsx` oluşturuldu (`useTheme` hook kullanıyor)
  - Settings sayfası server component → client component'a dönüştürüldü

- **Change Password** (Settings sayfası)
  - `POST /api/account/password` endpoint'i oluşturuldu
  - Mevcut şifre doğrulama (bcrypt compare) + yeni şifre hash'leme
  - Min 8 karakter validasyonu

- **Delete Account** (Settings sayfası)
  - `DELETE /api/account/delete` endpoint'i oluşturuldu
  - Cascade: user silinince `otp_services` ve `otp_logs` da silinir
  - Silme sonrası otomatik signOut + `/login` redirect

- **Nav User menüsü**
  - İşlevsiz Account, Billing, Notifications menu item'ları kaldırıldı
  - Sadece çalışan "Log out" kaldı

- **Forgot Password linki**
  - `<a href="#">` dead link → bilgilendirici `<span>` metni

- **Documentation butonu** (site-header)
  - İşlevsiz buton header'dan kaldırıldı

#### UX İyileştirmeleri

- **`window.location.reload()` → `router.refresh()`**
  - `data-table.tsx`: rotateUrl, resetUrl, deleteService fonksiyonlarında (3 yer)
  - Daha hızlı, sayfayı tamamen yeniden yüklemeden veri güncelleniyor

- **Lokalizasyon tutarlılığı**
  - "Kopyalandı!" → "Copied to clipboard!"
  - "Servisini silmek istediğine emin misin?" → "Delete [name]? This cannot be undone."
  - Dialog description Türkçe → İngilizce
  - "Henüz servis eklenmemiş" → "No services added yet."
  - Live code dialog Türkçe → İngilizce

- **Analytics performansı**
  - Eskisi: tüm logları çek → client-side JavaScript'te filtrele
  - Yenisi: SQL `GROUP BY DATE_TRUNC('day', created_at)` ile DB'de aggregate
  - Timezone-safe: `AT TIME ZONE 'UTC'`
  - Eksik günler 0 ile doldurulur (client-side Map lookup)

---

## [1.x] — Öncesi (Supabase Auth dönemi)

- Supabase Auth (magic link + email/password)
- Supabase DB (PostgREST)
- Cloudflare Pages deploy
- `wrangler.toml` konfigürasyonu
- `@cloudflare/next-on-pages` build tool
