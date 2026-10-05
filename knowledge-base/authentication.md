# Authentication — Knowledge Base

## 401 Unauthorized
- Signals: 401, `WWW-Authenticate: Bearer ...`
- Likely cause: missing, malformed, or **expired** token
- Fix: obtain a fresh token; check the header format `Authorization: Bearer <token>`; check clock skew

## 403 Forbidden
- Signals: 403
- Likely cause: authenticated but **not authorized** — missing scope/role, IP restriction
- Fix: check the required scopes/roles; verify the token's scopes

## 407 Proxy Authentication Required
- Signals: 407, `Proxy-Authenticate`
- Likely cause: a corporate proxy requires authentication
- Fix: configure proxy credentials

## Token expired vs invalid
- Signals: `WWW-Authenticate` with `error="invalid_token"`, `error_description="token expired"`
- Likely cause: expired (refresh it) vs invalid (wrong audience/signature/revoked)
- Fix: refresh if expired; re-issue if invalid

## Wrong scheme
- Signals: 401 with an unexpected scheme (Basic vs Bearer), or a malformed header
- Fix: match the scheme the API expects

## Never
- Never ask for or handle user credentials. Diagnose from evidence only.
