import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getHealth } from '../controllers/health.js';
import { getLeaderboard } from '../controllers/leaderboard.js';
import { getRounds } from '../controllers/rounds.js';
import { getTaxonomy } from '../controllers/taxonomy.js';
import { postContact } from '../controllers/contact.js';

const contactLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true });

export const apiRouter = Router();

apiRouter.get('/health', getHealth);
apiRouter.get('/leaderboard', getLeaderboard);
apiRouter.get('/rounds', getRounds);
apiRouter.get('/taxonomy', getTaxonomy);
apiRouter.post('/contact', contactLimiter, postContact);
