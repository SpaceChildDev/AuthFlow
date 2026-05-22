"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Key, Lock, Globe, Zap, Shield, Info, Cpu } from "lucide-react"

export function SecurityGuide() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/40 dark:bg-slate-900/60 dark:border-slate-700 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-blue-50/60 dark:hover:bg-slate-800/40 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2.5 text-sm font-semibold text-blue-700 dark:text-blue-400">
          <Shield className="h-4 w-4" />
          How does URL security work?
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-blue-500" />
          : <ChevronDown className="h-4 w-4 text-blue-500" />
        }
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 text-sm text-slate-600 dark:text-slate-300">

          {/* Layer 1: API Key */}
          <Section icon={<Key className="h-3.5 w-3.5 text-blue-600" />} title="Layer 1 — API Key">
            <p>
              Every request to a service URL must include your API key. Without it the server returns <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">401 Unauthorized</code>.
            </p>
            <p className="mt-1.5">Two ways to pass the key:</p>
            <ul className="mt-1 space-y-1 list-disc pl-4">
              <li>Query string: <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">?key=YOUR_API_KEY</code></li>
              <li>HTTP header: <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">X-API-Key: YOUR_API_KEY</code></li>
            </ul>
            <div className="mt-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
              https://your-app.com/github?key=YOUR_API_KEY
            </div>
          </Section>

          {/* Layer 2: Private URL */}
          <Section icon={<Lock className="h-3.5 w-3.5 text-orange-500" />} title="Layer 2 — Private Random URL (optional)">
            <p>
              When you enable <strong>Use Private Random URL</strong> while adding a service, a random 24-character hex token is generated and stored in the database (e.g. <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">a3f9c2b1e04d...</code>).
            </p>
            <p className="mt-1.5">
              The service can then be accessed via this token <em>instead of</em> the slug. The slug still exists in the DB but the webhook URL shown in the table uses the token:
            </p>
            <div className="mt-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 break-all">
              https://your-app.com/<span className="text-orange-500">a3f9c2b1e04d8f72b6c3a91d</span>?key=YOUR_API_KEY
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Since the token is unguessable (96 bits of randomness), even someone who knows the app URL cannot enumerate or brute-force valid endpoints. Use <strong>Rotate Private URL</strong> from the actions menu to invalidate the old token instantly.
            </p>
          </Section>

          {/* Slug vs Private */}
          <Section icon={<Globe className="h-3.5 w-3.5 text-slate-500" />} title="Slug vs. Private URL — when to use which">
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-1">
                <p className="font-semibold text-xs text-slate-700 dark:text-slate-200">Slug (public)</p>
                <p className="text-xs text-slate-500">Human-readable path like <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">/github</code>. Fine when the app is on a private network or only you know the URL. API key is still required.</p>
              </div>
              <div className="rounded-lg border border-orange-200 dark:border-orange-800/40 bg-orange-50/40 dark:bg-orange-900/10 p-3 space-y-1">
                <p className="font-semibold text-xs text-orange-700 dark:text-orange-400">Private URL</p>
                <p className="text-xs text-slate-500">Token replaces the slug. Recommended for internet-exposed deployments or any time you paste the URL into a third-party tool like Zapier or n8n.</p>
              </div>
            </div>
          </Section>

          {/* Token generation */}
          <Section icon={<Cpu className="h-3.5 w-3.5 text-violet-500" />} title="How is the token generated from a URL?">
            <p>
              When you open a service URL in the browser, the request goes through this pipeline:
            </p>
            <div className="mt-2 space-y-1">
              {[
                { step: "1", label: "Next.js routing", desc: "The path segment (e.g. /github) is caught by app/[service]/route.ts — a catch-all that intercepts every path that isn't login, dashboard or api." },
                { step: "2", label: "API key check", desc: "?key= query param (or X-API-Key header) is compared against the API_KEY environment variable. No match → 401." },
                { step: "3", label: "DB lookup", desc: 'SELECT * FROM otp_services WHERE slug = "github" OR access_token = "github". If found, secret + digits + step + algorithm come from DB.' },
                { step: "4", label: "Raw secret fallback", desc: "If nothing found in DB and the path is 16+ characters long, the path itself is treated as the raw TOTP secret — useful for quick ad-hoc calls without adding a service." },
                { step: "5", label: "TOTP generation", desc: "generateTOTP() runs in lib/totp.ts using the Web Crypto API (no external library). See math below." },
                { step: "6", label: "Response", desc: "?raw=true → plain text code only. Default → JSON with token, seconds_remaining, expires_at, digits, step, algorithm." },
              ].map(({ step, label, desc }) => (
                <div key={step} className="flex gap-2.5">
                  <span className="mt-0.5 flex-shrink-0 h-4 w-4 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 text-[10px] font-bold flex items-center justify-center">{step}</span>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs">{label} </span>
                    <span className="text-xs text-slate-500">{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">TOTP math (RFC 6238)</p>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2.5 font-mono text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div><span className="text-violet-500">counter</span>  = floor(unix_timestamp / step)   <span className="text-slate-400">// changes every 30 s</span></div>
                <div><span className="text-violet-500">hmac</span>     = HMAC-SHA1(secret_bytes, counter as 8-byte big-endian)</div>
                <div><span className="text-violet-500">offset</span>   = last_byte_of_hmac &amp; 0x0F</div>
                <div><span className="text-violet-500">binary</span>   = 4 bytes from hmac[offset] with top bit masked</div>
                <div><span className="text-violet-500">token</span>    = binary mod 10^digits           <span className="text-slate-400">// e.g. mod 1 000 000</span></div>
              </div>
              <p className="text-[11px] text-slate-400">
                Because the counter is derived purely from the current time, anyone calling the same endpoint within the same 30-second window gets the same code — that's by design and how every authenticator app works.
              </p>
            </div>
          </Section>

          {/* Zapier / n8n */}
          <Section icon={<Zap className="h-3.5 w-3.5 text-yellow-500" />} title="Using with Zapier, n8n, Make (Integromat) etc.">
            <p>
              Automation tools can call the endpoint via an <strong>HTTP GET</strong> node. There are two response formats:
            </p>
            <div className="mt-2 space-y-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">JSON response (default)</p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 break-all">
                  https://your-app.com/&#123;slug-or-token&#125;?key=YOUR_API_KEY
                </div>
                <div className="mt-1 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {"{"} "token": "482917", "seconds_remaining": 14, ... {"}"}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Parse <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">token</code> from the JSON body in your automation step.</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Plain text response — add <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">&raw=true</code></p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 break-all">
                  https://your-app.com/&#123;slug-or-token&#125;?key=YOUR_API_KEY&raw=true
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Returns just <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">482917</code> as plain text — easiest to use in Zapier "Webhooks" step or n8n "HTTP Request" node when you want to directly paste the code into the next action without any parsing.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/10 px-3 py-2">
              <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                Use <strong>Private URL + raw=true</strong> when pasting into Zapier or n8n. This way neither the slug nor the API key needs to be in a form field visible to anyone browsing the automation — the private token already acts as a second secret.
              </p>
            </div>
          </Section>

        </div>
      )}
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
        {icon}
        <span>{title}</span>
      </div>
      <div className="pl-5 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
        {children}
      </div>
    </div>
  )
}
