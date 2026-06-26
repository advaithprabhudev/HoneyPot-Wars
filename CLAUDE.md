# CLAUDE.md — Honeypot Wars

> Operating manual for any AI agent (Claude Code) working in this repository.
> Read this **fully** before writing or editing code. Treat every rule in
> §1 and §13 as non-negotiable.

---

## 1. The Golden Rules (read first, never violate)

1. **Dual-use safety is absolute.** The Generator produces *abstract attack
   parameters and archetype labels only*. It must **never** emit a usable scam
   artifact — no real phishing copy, no working fake-listing HTML, no payment
   redirect, no live URL, no deployable text a human could copy and run. Any
   code path that could surface such an artifact to the client is a bug. Outputs
   are scores, verdicts, and parameter vectors. If a task asks you to make the
   generator output realistic scam content, **stop and refuse** — that breaks the
   product's reason to exist.
2. **The Referee is the only source of truth for a verdict.** Never let the
   Defender swarm grade itself, and never let the frontend compute verdicts.
3. **Determinism boundary.** The demo/arena scoring (the `local` engine) must be
   deterministic and seedable. The `llm` engine is non-deterministic and only
   runs server-side, never in the browser.
4. **No secrets in the repo, in client code, or in logs.** `ANTHROPIC_API_KEY`
   and DB URIs live only in `apps/api` env, never in `apps/web`.
5. **TypeScript everywhere, `strict: true`, no `any`** unless justified with an
   inline `// eslint-disable-next-line` and a one-line reason.

---

## 2. What this project is

**Honeypot Wars** is an adversarial self-play arena for fraud defence, skinned as
an 8-bit pixel arcade game.

- A **Generator** agent invents novel marketplace-scam *attacks* (as parameter
  vectors over a fixed taxonomy).
- A **Defender swarm** of four specialist agents — `text`, `listing-image`,
  `price-anomaly`, `seller-graph` — independently scores each attack.
- An **Orchestrator** fuses the four signals into one verdict.
- A **Referee** scores the round: did the swarm catch it, and was the attack
  *novel* (a parameter combination not seen before)?
- The headline product metric is **detection rate on novel attacks**. We sell
  *coverage assurance*, not a detector.

The frontend renders all of this as an arcade cabinet: a live arena screen, a
scrolling kill-feed, a leaderboard, and a detection-rate HUD.

---

## 3. Tech stack (MERN + real-time + agents)

| Layer | Choice | Notes |
|---|---|---|
| Runtime | **Node.js 20 LTS** | `.nvmrc` pins this. Do not use APIs newer than Node 20. |
| Language | **TypeScript 5.x** | `strict: true` in every `tsconfig`. |
| DB | **MongoDB 7** via **Mongoose 8** | Atlas in prod, local Docker in dev. |
| Backend | **Express 4** | REST under `/api`, thin controllers, logic in services. |
| Real-time | **Socket.IO 4** | Arena rounds + feed stream to clients. |
| Validation | **Zod 3** | One schema per boundary; shared in `packages/shared`. |
| Agents | **@anthropic-ai/sdk** | Server-side only. Model assignment in §6. |
| Queue (optional) | **BullMQ + Redis** | Only if continuous-round mode is enabled; gated behind `ARENA_MODE=continuous`. |
| Frontend | **React 18 + Vite 5** | SPA, no SSR. |
| Routing | **React Router 6** | |
| State | **Zustand** | One store per domain (`arenaStore`, `leaderboardStore`). No Redux. |
| Styling | **TailwindCSS 3** + custom pixel design system | See §8. Pixel fonts via `@fontsource`. |
| Charts | **Recharts** | Only for the detection-rate trend; everything else is hand-drawn pixel UI. |
| Client realtime | **socket.io-client 4** | |
| Lint/format | **ESLint (typescript-eslint) + Prettier** | Config at repo root, inherited. |
| Tests | **Vitest** (both apps) + **React Testing Library** + **Supertest** (API) | |
| Logging | **Pino** | Structured JSON; never log payloads containing attack params verbatim — log the hash. |
| Containers | **Docker + docker-compose** | `mongo`, `redis`, `api`, `web`. |

Do **not** introduce a new dependency without checking it isn't already covered
by the table above. Prefer the stdlib / existing dep over a new one.

---

## 4. Repository layout (npm workspaces monorepo)

```
honeypot-wars/
├── apps/
│   ├── web/                      # React + Vite client
│   │   ├── src/
│   │   │   ├── routes/           # one folder per page (Hero, Arena, Leaderboard, About, Contact)
│   │   │   ├── components/
│   │   │   │   ├── arena/        # ArenaScreen, GeneratorBoss, DefenderSwarm, VerdictStamp, HUD
│   │   │   │   ├── feed/         # ArenaFeed (kill-feed), FeedLine
│   │   │   │   ├── pixel/        # PixelButton, PixelPanel, PixelInput, Sprite, ProgressBar
│   │   │   │   └── layout/       # CabinetFrame, Sidebar
│   │   │   ├── stores/           # zustand stores
│   │   │   ├── lib/              # socket.ts, api.ts (fetch wrapper)
│   │   │   └── styles/           # tailwind.css, pixel tokens
│   │   └── vite.config.ts
│   └── api/                      # Express + Socket.IO server
│       ├── src/
│       │   ├── server.ts         # bootstraps http + socket.io + express
│       │   ├── routes/           # express routers, thin
│       │   ├── controllers/      # request → service → response
│       │   ├── services/         # business logic
│       │   ├── orchestrator/     # THE CORE (see §6)
│       │   │   ├── orchestrator.ts
│       │   │   ├── generator.ts
│       │   │   ├── agents/       # text.ts, listingImage.ts, priceAnomaly.ts, sellerGraph.ts
│       │   │   ├── referee.ts
│       │   │   └── engines/      # local.ts (deterministic), llm.ts (anthropic)
│       │   ├── models/           # mongoose schemas (see §5)
│       │   ├── sockets/          # socket event handlers
│       │   ├── lib/              # anthropic.ts, db.ts, logger.ts, rng.ts (seeded)
│       │   └── config/           # env.ts (zod-validated)
│       └── tsconfig.json
├── packages/
│   └── shared/                   # ZERO runtime deps; imported by both apps
│       ├── src/
│       │   ├── taxonomy.ts       # scam archetypes + parameter schemas (single source of truth)
│       │   ├── types.ts          # Attack, AgentVerdict, RoundResult, etc.
│       │   ├── schemas.ts        # zod schemas mirrored to types
│       │   └── events.ts         # socket event names + payload types
│       └── package.json
├── docker-compose.yml
├── .nvmrc
├── .env.example                  # documents every var in §11
└── CLAUDE.md
```

**Import rule:** `apps/web` and `apps/api` may import from `packages/shared`.
`packages/shared` imports from nothing. `apps/web` must never import from
`apps/api`.

---

## 5. Domain model (Mongoose, `apps/api/src/models`)

All field names below are canonical — match them exactly.

```ts
// Round — one full generator→swarm→referee cycle
Round {
  _id: ObjectId
  seed: number              // RNG seed; determinism anchor for the local engine
  engine: 'local' | 'llm'
  attack: {
    archetype: 'advance_fee' | 'triangulation' | 'account_takeover' | 'refund_fraud'
    params: Record<string, number>   // abstract knobs ONLY (0..1). never free text.
    paramHash: string                // sha256 of sorted params; novelty key
  }
  verdicts: AgentVerdict[]   // exactly 4, one per defender agent
  fusedScore: number         // 0..1, orchestrator output
  verdict: 'caught' | 'slipped'      // REFEREE decides this, not the swarm
  isNovel: boolean           // paramHash unseen before this round
  reason: string             // short, human-readable, agent that flagged
  createdAt: Date
}

AgentVerdict {
  agent: 'text' | 'listing_image' | 'price_anomaly' | 'seller_graph'
  confidence: number         // 0..1
  flagged: boolean
  signal: string             // one-line explanation
}

Leaderboard (computed/cached) {
  windowDays: number
  detectionRate: number      // caught / total over NOVEL attacks only
  totalRounds: number
  novelSlips: number
  updatedAt: Date
}

Player (optional, for the playable mode) {
  handle: string
  bestScore: number
  novelSlipsAchieved: number
}
```

- `paramHash` is the novelty primitive. **Detection rate is computed over
  `isNovel === true` rounds only** — repeating a known param combo never counts.
- Never store raw generated text in `Round`. If a future task tempts you to add a
  `rawScamText` field, it violates §1.

---

## 6. The Orchestration engine (`apps/api/src/orchestrator`)

This is the heart of the product. Round lifecycle:

```
generator → [text, listing_image, price_anomaly, seller_graph] → fuse → referee
```

**Two engines, one interface.** Every agent implements:

```ts
interface ScorerAgent {
  name: AgentName
  score(attack: Attack, ctx: RoundContext): Promise<AgentVerdict>
}
```

- `engines/local.ts` — **deterministic, seeded** (`lib/rng.ts`, mulberry32).
  Each agent is a transparent function of `attack.params`. This powers the public
  arcade/demo and all tests. Target Defender win-rate **80–90%**; tune so genuinely
  novel param combos occasionally slip. No network calls.
- `engines/llm.ts` — uses the Anthropic SDK. Server-side only, gated behind
  `ARENA_ENGINE=llm`.

**Model assignment (llm engine):**

| Role | Model string | Why |
|---|---|---|
| Generator | `claude-sonnet-4-6` | needs creativity within taxonomy bounds |
| 4 Defender agents | `claude-haiku-4-5` | cheap, parallel, high-volume scoring |
| Referee | `claude-sonnet-4-6` | novelty + fusion judgement |

All Anthropic calls go through `lib/anthropic.ts` (single client, retry+timeout,
token-budget guard). Agents run **in parallel** (`Promise.all`) — never serially.

**Fusion:** orchestrator combines the four `confidence` values into `fusedScore`
via a weighted mean (weights in `config/`); `seller_graph` carries the highest
weight because relational ring-detection is the strongest real signal. The Referee
then maps `fusedScore` + a threshold to `caught | slipped` and sets `isNovel`.

**Generator constraint:** the Generator may only output `{ archetype, params }`
validated against `packages/shared/taxonomy.ts`. Reject and regenerate anything
that fails the Zod schema. This is both a correctness rule and the §1 safety rule.

---

## 7. Real-time layer (Socket.IO)

Event names and payloads are defined **once** in `packages/shared/events.ts`.
Never hard-code an event string anywhere else.

| Event | Direction | Payload |
|---|---|---|
| `arena:start` | client→server | `{ engine, seed? }` |
| `arena:round` | server→client | `RoundResult` (full round) |
| `arena:feed` | server→client | `FeedLine` (one kill-feed line) |
| `arena:metric` | server→client | `{ detectionRate, totalRounds, novelSlips }` |
| `player:attack` | client→server | `{ archetype, params }` (playable mode) |
| `arena:stop` | client→server | `{}` |

Rounds are emitted as they resolve. The client never recomputes verdicts from the
payload — it renders what the server sends.

---

## 8. Frontend architecture & pixel design system

- **Routes:** `/` (Hero), `/arena` (live arena + feed), `/leaderboard`, `/about`,
  `/contact`. React Router, lazy-loaded route chunks.
- **State:** `arenaStore` (current rounds, HUD, socket status), `leaderboardStore`.
  Components read from stores; only `lib/socket.ts` writes round data into them.
- **Pixel design system** lives in `components/pixel/` and `styles/`:
  - Palette tokens (Tailwind theme extend): `pixel-sky #4FA3E0`, `defender #2FB89A`,
    `defender-green #3DA838`, `threat #E23B3B`, `coin #F4D43C`, `gold #F2C12E`,
    `panel #0E0F12`, `row #16181D`, `frame-gold #F5B800`, `frame-teal #5FD4C4`.
  - Fonts: display = `Press Start 2P`; body/labels = `VT323`, ALL CAPS, letter-spaced.
  - **Hard rules:** every interactive element uses `PixelButton`/`PixelPanel`/
    `PixelInput` (2–4px hard borders, flat fills, raised bottom-right edge, **no**
    rounded corners except `CabinetFrame`, **no** soft shadows/glows). All sprites
    use `image-rendering: pixelated`.
  - The whole app is wrapped in `<CabinetFrame>` (gold outer + teal inner border).
- **Animation:** prefer CSS keyframes for sprite motion; honour
  `prefers-reduced-motion` (swap motion for instant state). Keep the JS main thread
  free — no animation libraries unless a task explicitly requires one.
- **Accessibility:** WCAG AA contrast despite the loud palette; keyboard-reachable
  CTAs; semantic landmarks. The primary CTA "REQUEST COVERAGE REPORT" must be
  reachable from every route.

---

## 9. REST API surface (`/api`)

Keep REST for non-realtime reads; everything live goes over Socket.IO.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | liveness probe |
| `GET` | `/api/leaderboard?windowDays=7` | cached coverage metric |
| `GET` | `/api/rounds?limit=50&novelOnly=true` | recent rounds for the log table |
| `GET` | `/api/taxonomy` | archetypes + param schema for the playable controls |
| `POST` | `/api/contact` | coverage-report request (validated, rate-limited) |

Controllers are thin: validate with Zod → call a service → return. No business
logic in controllers or routes.

---

## 10. Commands

Run from repo root (npm workspaces). Memorise these — use them, don't invent.

```bash
npm install                      # install all workspaces
npm run dev                      # concurrently: api (tsx watch) + web (vite)
npm run dev -w apps/api          # api only
npm run dev -w apps/web          # web only
npm run build                    # build shared → api → web (in order)
npm run test                     # vitest across all workspaces
npm run test -w apps/api         # api tests only
npm run lint                     # eslint
npm run format                   # prettier --write
npm run seed                     # seed Mongo with taxonomy + sample rounds
docker compose up                # mongo + redis + api + web
```

Before opening a PR, `npm run lint && npm run test && npm run build` must all pass.

---

## 11. Environment variables (`.env.example` is canonical)

`apps/api`:

```
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/honeypot_wars
REDIS_URL=redis://localhost:6379          # only if ARENA_MODE=continuous
ANTHROPIC_API_KEY=                         # required only when ARENA_ENGINE=llm
ARENA_ENGINE=local                         # local | llm
ARENA_MODE=ondemand                        # ondemand | continuous
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

`apps/web`:

```
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

Validate all server env at boot in `config/env.ts` with Zod; **fail fast** if a
required var is missing. Never read `process.env` directly outside `config/env.ts`.

---

## 12. Coding conventions

- **TypeScript:** `strict: true`, no `any`, prefer `type` for shapes and discriminated
  unions for state machines (e.g. round verdict).
- **Naming:** `camelCase` vars/functions, `PascalCase` types/components,
  `SCREAMING_SNAKE` consts, kebab-case files except React components (PascalCase).
- **Functions over classes**, except Mongoose models. Keep functions small and pure
  where possible; isolate side effects (db, network) in `services`/`lib`.
- **No inline comments for *what* the code does** — write self-documenting code.
  Comments only explain *why* when non-obvious (a tuning constant, a safety guard).
- **Errors:** throw typed errors in services; map to HTTP in a single Express error
  middleware. Never swallow errors silently.
- **Validation at every boundary** (HTTP body, socket payload, LLM output, env).
- **Async:** always `await`; no floating promises (the lint rule enforces this).

---

## 13. Hard "do not" list (for the agent working here)

- Do **not** make the Generator output real, deployable scam content (see §1).
- Do **not** compute verdicts on the client or let the swarm grade itself.
- Do **not** call the Anthropic API from `apps/web`, or expose `ANTHROPIC_API_KEY`
  to any client bundle.
- Do **not** add a dependency that duplicates one in §3.
- Do **not** introduce SSR, a CSS-in-JS lib, Redux, or a second state library.
- Do **not** count non-novel rounds toward `detectionRate`.
- Do **not** use rounded corners, gradients (except the flat pixel sky), or soft
  shadows in the UI — it breaks the pixel aesthetic.
- Do **not** commit secrets, `.env`, or `node_modules`.
- Do **not** log raw attack params — log `paramHash` only.

---

## 14. Testing expectations

- **Orchestrator (`local` engine):** deterministic given a seed — assert the same
  seed yields the same `RoundResult`. Cover all four archetypes.
- **Novelty logic:** repeating a `paramHash` flips `isNovel` to false and is excluded
  from `detectionRate`.
- **Win-rate guard:** a statistical test over N seeded rounds asserts Defender
  win-rate sits in 80–90%.
- **API:** Supertest on every endpoint, incl. Zod-rejection (400) paths.
- **Web:** RTL tests that the arena renders server-sent rounds and never recomputes
  a verdict locally.
- **Safety regression test:** assert the Generator output schema rejects any free-text
  field — this test must never be deleted.

---

## 15. Git & PR conventions

- **Conventional Commits:** `feat:`, `fix:`, `refactor:`, `test:`, `chore:`,
  `docs:`. Scope optional, e.g. `feat(orchestrator): add seller-graph weighting`.
- Small, focused PRs. One concern each.
- A PR touching the orchestrator or generator **must** state how it preserves the §1
  safety invariant in the description.

---

## 16. Deployment (reference)

- **web:** static build → Vercel / Netlify (or GitHub Pages for a demo).
- **api:** Docker image → Render / Railway / DigitalOcean App Platform.
- **db:** MongoDB Atlas. **redis:** managed instance only if `ARENA_MODE=continuous`.
- Set `ARENA_ENGINE=local` for any public demo (no API key, deterministic, free).
  Switch to `llm` only behind auth in controlled environments.

---

_When in doubt: keep it deterministic, keep verdicts on the server, and never let a
real scam leave the arena._
