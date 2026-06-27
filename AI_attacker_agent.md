# AI Attacker Agent — Honeypot Wars

## What the Agent Does

The agent is a **static-analysis security assessment arena** — not a live penetration tester. It simulates the question: *"If a real attacker exploited a vulnerability in your codebase right now, would your defences detect it?"*

It runs one "round" per invocation: the Scanner plays attacker, four Defender agents play the blue team, and a Referee decides whether the attack slipped past.

---

## How It Works — Step by Step

```
Seed (number)
    │
    ▼
┌──────────────────────────────────────────────┐
│  1. SCANNER  (claude-sonnet-4-6)              │
│  Picks a vuln category, then generates a     │
│  16-param risk vector  (all floats 0–1).     │
│  Never emits exploit strings or credentials. │
│  Output: VulnFinding { category, params,     │
│           severity, fingerprintHash }         │
└──────────────────────────────────────────────┘
    │
    ▼  (same finding sent to all four, in parallel)
┌──────┐  ┌───────────┐  ┌────────┐  ┌────────────┐
│secrets│  │ injection │  │ config │  │ dependency │
│haiku  │  │  haiku    │  │ haiku  │  │   haiku    │
│ 4.5   │  │  4.5      │  │  4.5   │  │   4.5      │
└──────┘  └───────────┘  └────────┘  └────────────┘
   confidence 0–1 each, with a one-line signal
    │
    ▼
┌──────────────────────────────────────────────┐
│  3. FUSION                                    │
│  Weighted mean of the 4 confidences:         │
│  secrets×0.35 + injection×0.25               │
│          + config×0.20 + dependency×0.20     │
│  → fusedScore (0–1)                          │
└──────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────┐
│  4. REFEREE  (claude-sonnet-4-6)              │
│  fusedScore ≥ 0.31  →  caught                │
│  fusedScore < 0.31  →  slipped               │
│  Also sets isNovel (fingerprint unseen?)     │
│  Only novel slips count toward the gap score │
└──────────────────────────────────────────────┘
    │
    ▼
  RoundResult { verdict, fusedScore, verdicts,
                finding, isNovel, reason }
```

### Each Role Explained

| Role | Model | What it does |
|---|---|---|
| **Scanner** | `claude-sonnet-4-6` | Generates a `VulnFinding` — a structured 16-number risk vector for one of 4 categories. Never emits an actual exploit. |
| **Secrets agent** | `claude-haiku-4-5` | Scores `entropy`, `scopeExposure`, `ageInDays`, `rotationRisk` |
| **Injection agent** | `claude-haiku-4-5` | Scores `inputSurface`, `sinkDanger`, `sanitiserPresence`, `reachability` |
| **Config agent** | `claude-haiku-4-5` | Scores `exposureLevel`, `bypassEase`, `defaultness`, `documentedRisk` |
| **Dependency agent** | `claude-haiku-4-5` | Scores `cvssScore`, `transitivity`, `exploitMaturity`, `updateAvailable` |
| **Referee** | `claude-sonnet-4-6` | Receives the fused score + all 4 verdicts, returns `caught`/`slipped` + a one-line reason |

### Novelty Tracking

Novelty is tracked by SHA-256 hashing the full param vector (`fingerprintHash`). If the same fingerprint has been seen before in this session, `isNovel = false` and that round is excluded from the `gapCoverageRate` metric.

---

## Key Source Files

| File | Role |
|---|---|
| `apps/api/src/orchestrator/engines/openai.ts` | Claude LLM engine — Scanner, Defenders, Referee |
| `apps/api/src/lib/anthropic.ts` | Single shared Anthropic client |
| `apps/api/src/orchestrator/orchestrator.ts` | Engine selection (local vs llm_claude) |
| `apps/api/src/orchestrator/scanner.ts` | Deterministic local scanner (used by local engine) |
| `apps/api/src/orchestrator/fusion.ts` | Weighted mean of 4 defender confidences |
| `apps/api/src/orchestrator/referee.ts` | Final verdict logic |
| `apps/api/src/orchestrator/agents/` | Four defender agents (secrets, injection, config, dependency) |
| `packages/shared/src/taxonomy.ts` | 4 categories, 16 params, weights, catch threshold |
| `packages/shared/src/schemas.ts` | Zod schemas — §A safety gate |

---

## How to Execute

### Prerequisites

Set the following environment variables (in `.env` or shell):

```bash
ANTHROPIC_API_KEY=sk-ant-...       # required for llm_claude engine
ARENA_ENGINE=llm_claude            # switch from default 'local'
SUPABASE_URL=https://...           # required by env.ts at boot
SUPABASE_SERVICE_ROLE_KEY=...      # required by env.ts at boot
```

### Start the API Server

```bash
# From the repo root:
npm run dev -w apps/api

# Or start everything (API + web):
npm run dev
```

The server starts on port `4000` by default.

### Trigger a Round via Socket.IO

Connect a Socket.IO client and emit the `arena:start` event:

```json
{ "engine": "llm_claude", "seed": 42 }
```

The server responds with an `arena:round` event containing the full `RoundResult`:

```ts
{
  id: "42-a3f1c2b9",
  seed: 42,
  engine: "llm_claude",
  finding: {
    category: "hardcoded_secret",
    severity: "critical",
    params: { entropy: 0.91, scopeExposure: 0.84, ... },
    fingerprintHash: "a3f1c2b9...",
    location: { file: "[llm-extracted]", line: 0 }
  },
  verdicts: [
    { agent: "secrets",    confidence: 0.87, flagged: true,  signal: "entropy elevated (0.91)" },
    { agent: "injection",  confidence: 0.12, flagged: false, signal: "sinkDanger elevated (0.23)" },
    { agent: "config",     confidence: 0.09, flagged: false, signal: "exposureLevel elevated (0.14)" },
    { agent: "dependency", confidence: 0.11, flagged: false, signal: "cvssScore elevated (0.18)" }
  ],
  fusedScore: 0.34,
  verdict: "caught",
  isNovel: true,
  reason: "Secrets Scanner flagged Hardcoded Secret (novel)",
  createdAt: "2026-06-27T13:00:00.000Z"
}
```

### Run the Catch-Rate Tuning Script (no API key needed)

Runs 500 seeded rounds using the deterministic local engine and reports per-category detection rates:

```bash
npx tsx apps/api/src/scripts/tune-catchrate.ts
```

Target output: aggregate `gapCoverageRate` between 80–90%.

### Run the Test Suite

```bash
# All tests:
npm run test

# API tests only:
npm run test -w apps/api
```

---

## Safety Constraints

The Scanner **never emits a real exploit**. Its output is always `{ category, params }` where every param is a float 0–1. The Zod schema in `vulnFindingSchema` uses `.strict()` and rejects any extra fields — including any free-text or string-valued field that could carry a payload. That schema check is the §A safety gate and must never be removed or weakened.

- Hardcoded credentials detected by the scanner are stored only as `{ type, entropy, location }` — never the credential value.
- The Claude engine runs server-side only. `ANTHROPIC_API_KEY` never reaches the browser or client bundle.
- The Referee is the sole source of truth for `verdict`. The client renders what the server sends; it never recomputes verdicts locally.
