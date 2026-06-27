import type { Request, Response } from 'express'
import { VULN_CATEGORIES, AGENT_NAMES, PARAM_KEYS } from '@honeypot-wars/shared'

export function getTaxonomy(_req: Request, res: Response): void {
  res.json({
    categories: [...VULN_CATEGORIES],
    agents:     [...AGENT_NAMES],
    paramKeys:  [...PARAM_KEYS],
  })
}
