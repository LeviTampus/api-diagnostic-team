# SPEC — AI API Diagnostic Team (n8n)

Status: design for review
Date: 2026-10-05
Owner: Levi
Supersedes: `integration-api-diagnostic-agent` (archived LangGraph build)

---

## 1. Goal

Replace the archived single-agent API diagnostic tool with an **owned,
multi-agent diagnostic team**, built low-code in n8n. It investigates
API/integration failures conversationally and returns a structured diagnosis
(what was checked, findings, likely root cause, next steps).

Featured portfolio project. Demonstrates the 2026 hiring bar:
**multi-agent orchestration + conversational UX + observability (LangSmith) +
evaluation**, on the author's AI-Ops / API-diagnosis domain.

### Non-goals
- Not a general-purpose chatbot or a SaaS product.
- No real customer systems touched; demo uses seeded/safe targets.
- v1 does not include every specialist (see §4 scope).

## 2. Confirmed decisions

| Decision | Choice |
|---|---|
| Platform | n8n (self-hosted Community) |
| Host | Render **free** web service (n8n Docker image) |
| Database | Supabase **free** Postgres (author keeps it awake via reminder) |
| LLM | Groq (`gpt-oss-120b` / `qwen3.8-27b`), OpenAI-compatible |
| Embeddings | Google `gemini-embedding-001` (hosted, free, no install) |
| Tracing | LangSmith (self-hosted n8n env vars) |
| Public surface | n8n **Chat Trigger** page (editor owner-locked) |
| Chat UI | n8n **built-in hosted chat page** (public); linked + iframe-embeddable from the portfolio |
| Diagnostics input | **Hybrid (Option C):** seeded playground + guarded arbitrary public URLs + "paste what failed" analysis |
| Memory | **Session-scoped** chat memory; **new chat forgets**; TTL cleanup |
| Cold start | Accepted; demo page shows a "may take 30–60s to wake" notice |
| v1 specialists | Orchestrator + HTTP Diagnostic + Authentication + Root-Cause |
| Knowledge base | **One small KB per agent** (markdown, public in the repo) → embedded to pgvector |
| Personalities | Each agent has a **distinct system prompt/persona** |
| Trace visibility | LangSmith **project link** in the chat (v1); per-session trace deep-link as a stretch |

## 3. Architecture

```
Public Chat (n8n Chat Trigger)
        │
   Orchestrator Agent  ── chat memory (per session)
        │  intent: chit-chat vs diagnose; asks clarifying questions
        ├─ tool → HTTP Diagnostic agent   (sub-workflow)
        ├─ tool → Authentication agent    (sub-workflow)
        ├─ tool → Root-Cause agent        (sub-workflow)
        └─ (later: Payload/Data, Log Analysis, Report)
        │
   Supabase Postgres (n8n data + audit)   ·   LangSmith (traces)
```

- **Nested-agent pattern:** each specialist is itself an **AI Agent** (its own
  reasoning + tools + KB), exposed to the orchestrator as a **sub-workflow tool**
  (`Call n8n Workflow Tool`) — not a vector-store-as-tool (avoids the n8n
  retrieve-as-tool schema quirks seen in Case Triage).
- The Orchestrator owns the conversation; specialist agents are called only when
  relevant; each specialist agent then calls its own tools (e.g. the HTTP agent
  calls an HTTP Request Tool).

## 4. Agents

### v1
| Agent | Responsibility | Own KB | Personality | Implementation |
|---|---|---|---|---|
| **Orchestrator** | Converse; classify intent; ask clarifying questions; delegate; compose final answer | routing/playbook notes | calm coordinator | AI Agent + chat memory + sub-workflow tools |
| **HTTP Diagnostic** | Request a **public** endpoint (unauthenticated): status, headers, latency, redirects, TLS, timeouts | HTTP failure modes | terse, technical | **AI Agent** + HTTP Request Tool (prompt-guarded; public URLs only) |
| **Authentication** | Diagnose auth failures from **pasted evidence** (status, `www-authenticate`, error body, curl); **no credentials ever requested** | auth error catalog | security-minded, precise | LLM analysis of pasted evidence (+ optional unauthenticated probe to detect 401) |
| **Root-Cause** | Synthesize the specialists' findings into a likely cause + confidence | root-cause heuristics | analytical, cautious | LLM over collected findings; structured output |

### Later (post-v1)
- **Payload/Data** — content-type, schema/shape, encoding, malformed JSON.
- **Log Analysis** — parse pasted logs; error patterns/timelines.
- **Report** — final structured report (what checked, findings, next steps).

### 4.1 Knowledge base (one per agent)
- Each agent gets its **own small KB** — no shared store — to keep retrieval simple
  and scoped.
- KB source is **markdown files in the public repo** under `knowledge-base/`
  (e.g. `http-diagnostic.md`, `authentication.md`, `root-cause.md`). Recruiters
  can read exactly where each agent's guidance comes from.
- Files are embedded into **Supabase pgvector** with Gemini embeddings and read
  back by that agent via a retriever tool.
- Keep each KB short (a runbook: failure modes → signals → likely cause → fix).

## 5. Conversation design

### Chat UI
- Use n8n's **built-in hosted chat page** (from the Chat Trigger) as the public
  surface. No custom front-end in v1.
- Configure title/subtitle/welcome message + input placeholder for light branding.
- Link it from the portfolio and/or **embed via `<iframe>`**.
- The n8n editor stays owner-locked; only the chat page is public.

### Memory (session-scoped)
- The Chat Trigger assigns each chat a **`sessionId`**.
- The Orchestrator uses a **memory node** keyed by that `sessionId`
  (Postgres Chat Memory, so it survives n8n restarts).
- Behavior:
  - Remembers within a conversation (e.g. "my name is Levi").
  - **"New chat" → new `sessionId` → fresh memory (forgets).**
  - Different visitors never share memory (different session ids).
- Bound the memory with a **window size** (e.g. last 10 messages).
- **TTL cleanup:** scheduled job deletes memory/session rows older than X hours
  (demo privacy + tidy storage).

### Intent handling
- Orchestrator classifies each user turn:
  - **chit-chat / meta** → answer directly, no tools.
  - **diagnostic** (URL, error, log, "why is X failing") → delegate.
- Ambiguous input → **one clarifying question** before running tools.

## 6. Diagnostics, data & safety

**Hybrid input (Option C)** — three ways to give the agent something to diagnose:

1. **Seeded playground (default).** 2–3 intentionally-broken demo endpoints
   (e.g. expired token → 401, wrong `Content-Type`, redirect loop). Always works;
   basis for the eval set.
2. **Arbitrary public URL.** Real HTTP requests via the HTTP agent's tool. The
   agent is **prompt-guarded** to fetch only public http(s) URLs — this is *not*
   a hard SSRF control (single-workflow design); rate limiting is the primary
   mitigation. Redirects capped, short timeout.
3. **"Paste what failed".** User pastes a curl/request+response/error log; the
   agent analyzes **with no outbound request** — safest and most realistic.

- SSRF is **prompt-mitigated, not hard-guarded** (single-workflow design); the
  rate limit is the primary control and the residual risk is documented.
- **No credentials, ever.** We never ask for or store tokens/passwords. The HTTP
  agent only makes **unauthenticated** calls; authenticated APIs are diagnosed
  via **paste mode** (the user pastes the failing response/curl) or via seeded
  endpoints that simulate auth failures. A 401 from an unauthenticated probe is
  a valid signal ("auth required") but deeper diagnosis uses pasted evidence.
- **RAG (later):** retrieval over troubleshooting notes using Gemini embeddings
  + pgvector to ground recommendations.

## 7. Observability & evaluation

- **LangSmith** tracing enabled via env vars (`LANGCHAIN_TRACING_V2`,
  `LANGCHAIN_API_KEY`, `LANGCHAIN_ENDPOINT`, `LANGCHAIN_PROJECT=api-diagnostic-team`),
  or the per-workflow LangSmith credential/project setting.
- **Trace visibility in the chat** (so recruiters can see what ran):
  - **v1:** append a **"See what ran →"** link to the LangSmith **project** in
    the chat footer.
  - **Stretch:** after a run, query the LangSmith API for that execution's trace
    (n8n tags traces with `execution_id`) and return the **direct trace URL**.
- **Eval set:** ~10–15 diagnostic scenarios with expected root cause; score the
  Root-Cause agent. Report one headline number.
- **Audit table** (Supabase): session id, request, agents used, verdict,
  confidence, created_at.

## 8. Deployment & demo guardrails

- Render free web service runs the official n8n image; connects to Supabase
  Postgres via `DB_POSTGRESDB_*` env vars.
- Fixed `N8N_ENCRYPTION_KEY` (stable across redeploys).
- `WEBHOOK_URL` = the Render public URL.
- Guardrails (demo URL):
  - **Rate limit** + **budget cap** on Groq/Gemini keys (shared public key).
  - **Session/turn limits**; no long-term persistence of visitors' data
    (session memory expires via TTL cleanup).
  - **Editor owner-locked**; only the chat surface public.
  - **Cold-start notice** on the landing page.
  - Demo terms: no real credentials; don't paste sensitive data.

## 9. Repo & presentation

- Public GitHub repo: sanitized workflows, README (problem → architecture →
  results/eval → failure modes → how to run), canvas screenshot + run GIF +
  LangSmith trace screenshot, SQL schema, deployment notes.
- **`knowledge-base/`** — the per-agent KB markdown, public (shows data sources).
- Replace the archived portfolio entry; link the live demo.
- Optional: submit to n8n Templates.

## 10. Risks / unknowns

- n8n multi-agent via sub-workflow tools — validate early.
- Groq/Gemini rate limits on a shared public key.
- Render free sleep + ephemeral FS (Supabase holds data; fixed encryption key).
- SSRF exposure from a public HTTP tool.
- Supabase free pausing after inactivity (mitigated by reminder).
- SUL compliance — OK (free demo, author owns credentials).

## 11. Milestones

1. **Infra:** Render web service + Supabase + env vars + LangSmith + owner login.
2. **Conversation core:** Chat Trigger → Orchestrator + session memory (chat works;
   new chat forgets; TTL cleanup).
3. **HTTP Diagnostic** sub-workflow tool + SSRF guard + seeded targets + its KB.
4. **Authentication** specialist + its KB.
5. **Root-Cause** specialist + its KB + structured output.
6. **Per-agent personalities** finalized.
7. **Eval set + LangSmith** traces + **"See what ran" link** in the chat.
8. **Demo hardening:** rate limits, cold-start notice, terms.
9. **Repo + README + portfolio** entry.
10. **Later specialists:** Payload/Data, Log Analysis, Report, RAG; per-session
    LangSmith deep-link.

## 12. Open decisions

Resolved: diagnostics input = hybrid Option C; memory = session-scoped with TTL;
chat UI = built-in hosted page; embeddings = Gemini; Postgres = Supabase.

Still open:
- Rate-limit mechanism (n8n-level vs Cloudflare vs front-end).
- Exact eval scoring rubric for root-cause correctness.
- TTL window length (e.g. 24h vs 7d) for session cleanup.
