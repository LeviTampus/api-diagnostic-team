# API Diagnostic Playground

A tiny Cloudflare Worker that serves **intentionally-broken endpoints** for the
AI API Diagnostic Team demo — so the agents always have a safe, controlled
target (no reliance on flaky public test services).

## Endpoints

| Path | Status | What it simulates |
|---|---|---|
| `/ok` | 200 | healthy control |
| `/expired-token` | 401 | expired bearer token (`WWW-Authenticate` set) |
| `/missing-token` | 401 | no Authorization header |
| `/forbidden` | 403 | valid token, missing scope |
| `/server-error` | 500 | unhandled exception |
| `/bad-gateway` | 502 | upstream unreachable |
| `/rate-limited` | 429 | rate limited (`Retry-After: 30`) |
| `/wrong-content-type` | 200 | `text/html` where JSON expected |
| `/slow` | 200 | delays 10s (timeout demo) |
| `/redirect-chain` | 302 | 3 hops then 200 |
| `/redirect-loop` | 302 | redirects to itself |

`/` returns the full scenario list as JSON.

## Deploy

**Option A — Cloudflare dashboard (no CLI):**
1. Cloudflare dashboard → **Workers & Pages → Create → Worker**.
2. Name it `api-diagnostic-playground`.
3. Paste the contents of `worker.js` into the editor → **Deploy**.
4. Note the URL: `https://api-diagnostic-playground.<your-subdomain>.workers.dev`.

**Option B — Wrangler CLI:**
```bash
npm install -g wrangler
wrangler login
wrangler deploy
```

## Deployed

Base URL: `https://api-diagnostic-playground.levijoan777.workers.dev`

## Use in the demo

Point the HTTP Diagnostic agent at these URLs, e.g.
`diagnose https://api-diagnostic-playground.levijoan777.workers.dev/expired-token`.
