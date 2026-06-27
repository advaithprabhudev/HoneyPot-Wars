import type { ContactInput } from '@honeypot/shared';
import { isMongoConnected } from '../lib/db.js';
import { logger } from '../lib/logger.js';

/**
 * Coverage-report request. We do not store scam content; only the lead's contact
 * details are retained. In demo mode (no Mongo) we just log receipt.
 */
export async function submitContact(input: ContactInput): Promise<{ received: true }> {
  logger.info(
    { email: input.email, company: input.company, mongo: isMongoConnected() },
    'coverage report requested',
  );
  return { received: true };
}
