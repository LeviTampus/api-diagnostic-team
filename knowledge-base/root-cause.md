# Root Cause — Knowledge Base

## Approach
- Correlate the signals from the specialists. Prefer the simplest explanation that fits **all** the evidence.
- Distinguish client-caused (4xx) vs server-caused (5xx) vs auth vs network.

## Heuristics
- 401/403 → auth layer (see the Authentication agent)
- 5xx → server or upstream
- Timeout while other calls return 200 → network/latency
- HTML where JSON expected → wrong endpoint or a proxy
- Redirect loop → misconfiguration
- Intermittent, tied to time/volume → rate limit or overload

## Confidence
- **High** when multiple independent signals agree.
- **Low** when the evidence is thin, contradictory, or the endpoint can't be reached.
- Never invent causes that the evidence doesn't support.
