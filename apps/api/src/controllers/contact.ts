import type { NextFunction, Request, Response } from 'express';
import { contactSchema } from '@honeypot/shared';
import { badRequest } from '../lib/errors.js';
import { submitContact } from '../services/contactService.js';

export async function postContact(req: Request, res: Response, next: NextFunction): Promise<void> {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    next(badRequest(parsed.error.issues[0]?.message ?? 'invalid contact payload'));
    return;
  }
  try {
    res.status(201).json(await submitContact(parsed.data));
  } catch (err) {
    next(err);
  }
}
