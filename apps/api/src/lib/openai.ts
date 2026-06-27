import OpenAI from 'openai'
import { env } from '../config/env.js'

let client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for the real scan agent. Set it in your .env file.')
  }
  if (!client) {
    client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      timeout: 60_000,
      maxRetries: 2,
    })
  }
  return client
}
