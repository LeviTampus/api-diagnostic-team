// API Diagnostic Playground — Cloudflare Worker
// A set of intentionally-broken endpoints for the AI API Diagnostic Team demo.
// Deploy: Cloudflare dashboard (Workers & Pages → Create → paste) or `wrangler deploy`.

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

const SCENARIOS = [
  { path: '/ok', status: 200, note: 'healthy control' },
  { path: '/expired-token', status: 401, note: 'expired bearer token' },
  { path: '/missing-token', status: 401, note: 'no auth header' },
  { path: '/forbidden', status: 403, note: 'valid token, missing scope' },
  { path: '/server-error', status: 500, note: 'unhandled exception' },
  { path: '/bad-gateway', status: 502, note: 'upstream unreachable' },
  { path: '/rate-limited', status: 429, note: 'retry-after 30' },
  { path: '/wrong-content-type', status: 200, note: 'text/html where JSON expected' },
  { path: '/slow', status: 200, note: 'delays 10s' },
  { path: '/redirect-chain', status: 302, note: '302 x3 then 200' },
  { path: '/redirect-loop', status: 302, note: 'redirects to itself' },
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    switch (path) {
      case '/':
        return json({ service: 'API Diagnostic Playground', scenarios: SCENARIOS });

      case '/ok':
        return json({ ok: true, message: 'healthy endpoint' });

      case '/expired-token':
        return json(
          { error: 'invalid_token', message: 'The access token expired at 2026-01-01T00:00:00Z' },
          401,
          {
            'WWW-Authenticate':
              'Bearer realm="api", error="invalid_token", error_description="token expired"',
          }
        );

      case '/missing-token':
        return json(
          { error: 'unauthorized', message: 'Missing Authorization header' },
          401,
          { 'WWW-Authenticate': 'Bearer realm="api"' }
        );

      case '/forbidden':
        return json(
          { error: 'insufficient_scope', message: 'Token lacks required scope: write:cases' },
          403
        );

      case '/server-error':
        return json({ error: 'internal_error', message: 'Unhandled exception in service' }, 500);

      case '/bad-gateway':
        return json({ error: 'bad_gateway', message: 'Upstream service unreachable' }, 502);

      case '/rate-limited':
        return json(
          { error: 'rate_limited', message: 'Too many requests' },
          429,
          { 'Retry-After': '30' }
        );

      case '/wrong-content-type':
        return new Response('<html><body><h1>Service OK</h1><p>HTML, not JSON.</p></body></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        });

      case '/slow':
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return json({ ok: true, message: 'responded after 10s' });

      case '/redirect-loop':
        return Response.redirect(url.origin + '/redirect-loop', 302);

      case '/redirect-chain': {
        const n = parseInt(url.searchParams.get('n') || '3', 10);
        if (n <= 1) return json({ ok: true, message: 'end of redirect chain' });
        return Response.redirect(url.origin + `/redirect-chain?n=${n - 1}`, 302);
      }

      default:
        return json({ error: 'not_found', message: `No such route: ${path}` }, 404);
    }
  },
};
