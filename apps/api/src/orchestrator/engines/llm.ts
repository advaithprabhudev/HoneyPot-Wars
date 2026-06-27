import {
  AGENT_PARAMS,
  PARAM_KEYS,
  generatedAttackSchema,
  type AgentName,
  type Attack,
} from '@honeypot/shared';
import { getAnthropic, MODELS } from '../../lib/anthropic.js';
import { paramHash } from '../../lib/hash.js';
import { clamp01 } from '../../lib/rng.js';
import { localSignal } from '../agents/localScoring.js';
import type { ArenaEngine, ScorerAgent } from '../types.js';

/**
 * The llm engine runs SERVER-SIDE ONLY and is gated behind ARENA_ENGINE=llm
 * (CLAUDE.md §1/§3/§6). The Generator may only emit { archetype, params }; its
 * output is validated against the shared schema, so no scam artifact can surface.
 */
function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object in model output');
  return JSON.parse(text.slice(start, end + 1));
}

async function llmGenerate(): Promise<Attack> {
  const client = getAnthropic();
  const res = await client.messages.create({
    model: MODELS.generator,
    max_tokens: 400,
    system:
      'You design ABSTRACT fraud-attack parameter vectors for a defensive research arena. ' +
      'You output ONLY JSON of the form {"archetype": <one of advance_fee|triangulation|account_takeover|refund_fraud>, ' +
      '"params": { ' +
      PARAM_KEYS.map((k) => `"${k}": <0..1>`).join(', ') +
      ' }}. Never output scam text, copy, URLs, or any deployable artifact.',
    messages: [
      {
        role: 'user',
        content:
          'Generate one novel attack as a parameter vector. Vary the knobs to explore the space. JSON only.',
      },
    ],
  });
  const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  const parsed = generatedAttackSchema.parse(extractJson(text));
  return { ...parsed, paramHash: paramHash(parsed.params) };
}

function makeLlmAgent(name: AgentName): ScorerAgent {
  return {
    name,
    async score(attack) {
      const client = getAnthropic();
      const owned = AGENT_PARAMS[name];
      const res = await client.messages.create({
        model: MODELS.defender,
        max_tokens: 120,
        system:
          `You are the "${name}" fraud-detection agent. Judge ONLY these abstract risk knobs: ` +
          owned.join(', ') +
          '. Reply with JSON {"confidence": <0..1>, "signal": "<short reason>"}.',
        messages: [
          {
            role: 'user',
            content: `Knobs: ${JSON.stringify(
              Object.fromEntries(owned.map((k) => [k, attack.params[k]])),
            )}. How likely is this fraudulent?`,
          },
        ],
      });
      const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
      let confidence = 0;
      let signal = localSignal(name, attack);
      try {
        const obj = extractJson(text) as { confidence?: number; signal?: string };
        confidence = clamp01(Number(obj.confidence ?? 0));
        if (typeof obj.signal === 'string') signal = obj.signal.slice(0, 160);
      } catch {
        confidence = 0;
      }
      return { agent: name, confidence, flagged: confidence >= 0.5, signal };
    },
  };
}

export const llmEngine: ArenaEngine = {
  engine: 'llm',
  generate: llmGenerate,
  agents: (['text', 'listing_image', 'price_anomaly', 'seller_graph'] as AgentName[]).map(
    makeLlmAgent,
  ),
};
