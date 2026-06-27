-- Migration 001: rounds table
-- Replaces MongoDB Round collection. Engine values updated for two LLM agents.

CREATE TABLE IF NOT EXISTS rounds (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  seed        INTEGER      NOT NULL,
  engine      TEXT         NOT NULL
                           CHECK (engine IN ('local', 'llm_claude', 'llm_openai')),
  archetype   TEXT         NOT NULL
                           CHECK (archetype IN ('advance_fee','triangulation','account_takeover','refund_fraud')),
  params      JSONB        NOT NULL,
  param_hash  TEXT         NOT NULL,
  verdicts    JSONB        NOT NULL,
  fused_score NUMERIC(7,6) NOT NULL CHECK (fused_score >= 0 AND fused_score <= 1),
  verdict     TEXT         NOT NULL CHECK (verdict IN ('caught','slipped')),
  is_novel    BOOLEAN      NOT NULL,
  reason      TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Fast novelty look-up (paramHashExists)
CREATE UNIQUE INDEX IF NOT EXISTS rounds_param_hash_idx ON rounds (param_hash);

-- Feed and leaderboard queries
CREATE INDEX IF NOT EXISTS rounds_created_at_idx ON rounds (created_at DESC);
CREATE INDEX IF NOT EXISTS rounds_is_novel_idx   ON rounds (is_novel) WHERE is_novel = TRUE;

-- Detection-rate window query
CREATE INDEX IF NOT EXISTS rounds_novel_created_idx
  ON rounds (created_at DESC) WHERE is_novel = TRUE;

-- Service-role key bypasses RLS; anon key has no access (§4 no secrets in client code).
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
