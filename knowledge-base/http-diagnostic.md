# HTTP Diagnostic — Knowledge Base

## 5xx server errors (500, 502, 503, 504)
- Signals: status 500/502/503/504; "internal server error", "bad gateway", "service unavailable", "gateway timeout"
- Likely cause: server-side failure — unhandled exception (500), upstream unreachable (502), overload/maintenance (503), upstream too slow (504)
- Fix: not client-caused; check the provider status page; retry with backoff for 502/503/504; report 500 with a trace id

## 4xx client errors (400, 404, 405, 415, 422)
- Signals: 400 bad request, 404 not found, 405 method not allowed, 415 unsupported media type, 422 unprocessable entity
- Likely cause: malformed request, wrong path, wrong method, wrong content-type, validation failure
- Fix: verify path/method; set the correct Content-Type; validate the payload against the schema

## Redirects (301/302/307/308) and loops
- Signals: a 3xx chain, "too many redirects", final URL differs from requested
- Likely cause: misconfigured redirect; http→https or trailing-slash loop; auth redirect back to itself
- Fix: follow the chain manually; fix the redirect target; ensure it terminates

## Wrong or unexpected content-type
- Signals: body is HTML when JSON was expected; Content-Type mismatch
- Likely cause: error page returned with 200; endpoint changed; a proxy injected a page
- Fix: check Content-Type; look for a captive portal/proxy; verify the endpoint

## Timeouts / latency
- Signals: request hangs; no response within threshold; unusually high latency
- Likely cause: slow upstream, large payload, network path, server overload
- Fix: raise the timeout only if justified; add retry; check the latency breakdown (DNS/TLS/TTFB)
