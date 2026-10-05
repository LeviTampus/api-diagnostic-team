# Eval Scenarios — AI API Diagnostic Team

Run each scenario through the orchestrator chat and mark whether the team's
**root cause** matched the expected one. One headline number = correct / total.

Base URL of the seeded playground:
`https://api-diagnostic-playground.levijoan777.workers.dev`

## Scenarios

| # | Input (paste this into the chat) | Expected root cause |
|---|---|---|
| 1 | `diagnose https://api-diagnostic-playground.levijoan777.workers.dev/server-error` | server-side 500 (unhandled app exception) |
| 2 | `diagnose https://api-diagnostic-playground.levijoan777.workers.dev/bad-gateway` | upstream unreachable (502) |
| 3 | `diagnose https://api-diagnostic-playground.levijoan777.workers.dev/expired-token` | expired bearer token (auth) |
| 4 | `diagnose https://api-diagnostic-playground.levijoan777.workers.dev/missing-token` | missing Authorization header (auth) |
| 5 | `diagnose https://api-diagnostic-playground.levijoan777.workers.dev/forbidden` | valid token, insufficient scope (403) |
| 6 | `diagnose https://api-diagnostic-playground.levijoan777.workers.dev/rate-limited` | rate limited (429) |
| 7 | `diagnose https://api-diagnostic-playground.levijoan777.workers.dev/wrong-content-type` | wrong content-type / proxy page |
| 8 | `diagnose https://api-diagnostic-playground.levijoan777.workers.dev/slow` | timeout / latency |
| 9 | `diagnose https://api-diagnostic-playground.levijoan777.workers.dev/redirect-loop` | redirect misconfiguration |
| 10 | Paste a 401 with `www-authenticate: ... error="invalid_token", error_description="token expired"` | expired token (auth) |
| 11 | Paste an HTML body where JSON was expected | wrong endpoint / proxy |
| 12 | Paste an intermittent 503 tied to peak hours | overload / rate limiting |

## Results

| # | Verdict matched? (Y/N) | Notes |
|---|---|---|
| 1 | Y | |
| 2 | Y | |
| 3 | Y | |
| 4 | Y | |
| 5 | Y | |
| 6 | Y | |
| 7 | Y | |
| 8 | Y | |
| 9 | Y | |
| 10 | Y | |
| 11 | Y | |
| 12 | Y | |

**Score:** 12 / 12

## Method & notes

- **Scoring:** manual, one run per scenario; the team's root-cause verdict was
  matched against the expected cause above.
- **Rate limits:** the Groq free tier occasionally interrupted a turn. Retry On
  Fail (3 tries, 5s) recovered automatically, so no scenario ended in a failed
  verdict. This is an operational characteristic of the free tier, not an eval
  failure — worth calling out in the README's failure-modes section.
- **Limitations:** single trial per scenario (no repeated runs for stability);
  judge is the author. A larger, multi-trial suite would tighten this number.
