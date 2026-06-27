# HoneyPot-Wars

**Honeypot Wars** is an adversarial self-play arena for fraud defence, skinned as an
8-bit pixel arcade game. A Generator invents novel marketplace-scam *attacks* (abstract
parameter vectors only — never real scam content), a four-agent Defender swarm scores
each attack, an Orchestrator fuses the signals, and a Referee decides whether the swarm
caught it. The headline metric is **detection rate on novel attacks**.

> See [`CLAUDE.md`](./CLAUDE.md) for the full operating manual and safety invariants.

## Quick start

```bash
npm install            # install all workspaces
npm run build          # build shared -> api -> web
npm run dev            # api (tsx watch, :4000) + web (vite, :5173)
```

Open http://localhost:5173 and go to the **ARENA** route, then press **START**.

The default engine is `local` — a deterministic, seeded scoring engine that needs no
API key and no database. MongoDB is optional in dev: if `MONGODB_URI` is unreachable
the API automatically falls back to an in-memory store so the arcade demo still runs.

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | run api + web together |
| `npm run dev -w apps/api` | api only |
| `npm run dev -w apps/web` | web only |
| `npm run build` | build shared, then api, then web |
| `npm run test` | vitest across workspaces |
| `npm run lint` | eslint |
| `npm run seed` | seed Mongo with taxonomy + sample rounds |

### Engines

- `ARENA_ENGINE=local` (default) — deterministic, seedable, offline. Powers the public demo.
- `ARENA_ENGINE=llm` — uses the Anthropic SDK, server-side only. Requires `ANTHROPIC_API_KEY`.

## Architecture

npm-workspaces monorepo:

- `packages/shared` — taxonomy, types, zod schemas, socket event contracts (zero runtime deps).
- `apps/api` — Express + Socket.IO + the orchestration engine (generator, swarm, referee).
- `apps/web` — React + Vite pixel-arcade client.
