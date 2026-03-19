# Claude Code — Project Rules

## Push Rules (STRICT)

**Asla push edilmeyecekler:**
- `credentials.md` ve benzeri credential dosyaları
- `CLAUDE*.md`, `GEMINI*.md` — AI yönlendirme dosyaları
- `*_BRIEF.md`, `*_PROMPT.md` — AI brief/prompt dosyaları
- `MIGRATION_*.md` — migration rehberleri
- `.gemini-clipboard/` — Gemini clipboard klasörü
- `.env`, `.env.local` ve türevleri

Bunlar **tamamen local** kalacak. `.gitignore`'da tanımlıdır, push edilmesi mümkün olmamalıdır.

## Repo Kuralları

- Repoda sadece ham proje dosyaları bulunur: kaynak kodu, `package.json`, `next.config.mjs`, `public/` vb.
- AI'a özel yönlendirme, brief, migration veya debug dosyaları commit edilmez.
- Credential içeren hiçbir dosya commit edilmez. Şüphe varsa `.gitignore`'a ekle, sonra sil.
- `Co-Authored-By` satırları commit mesajlarına eklenmez.

## Branch Yapısı

- `main` — production
- `dev` — geliştirme
