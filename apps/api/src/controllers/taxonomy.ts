import type { Request, Response } from 'express';
import {
  AGENT_NAMES,
  ARCHETYPES,
  ARCHETYPE_LABELS,
  AGENT_LABELS,
  PARAM_KEYS,
  AGENT_PARAMS,
} from '@honeypot/shared';

export function getTaxonomy(_req: Request, res: Response): void {
  res.json({
    archetypes: ARCHETYPES,
    archetypeLabels: ARCHETYPE_LABELS,
    agents: AGENT_NAMES,
    agentLabels: AGENT_LABELS,
    paramKeys: PARAM_KEYS,
    agentParams: AGENT_PARAMS,
  });
}
