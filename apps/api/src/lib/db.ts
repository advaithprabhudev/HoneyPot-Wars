import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from './logger.js';

let mongoConnected = false;

/**
 * Connect to MongoDB with a short timeout. In dev, an unreachable database is
 * non-fatal: services fall back to an in-memory store so the deterministic
 * arcade demo still runs (see services/roundStore.ts).
 */
export async function connectDb(): Promise<boolean> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 1500,
    });
    mongoConnected = true;
    logger.info('MongoDB connected');
  } catch (err) {
    mongoConnected = false;
    logger.warn(
      { err: (err as Error).message },
      'MongoDB unavailable — falling back to in-memory store (demo mode)',
    );
  }
  return mongoConnected;
}

export function isMongoConnected(): boolean {
  return mongoConnected;
}

export async function disconnectDb(): Promise<void> {
  if (mongoConnected) {
    await mongoose.disconnect();
    mongoConnected = false;
  }
}
