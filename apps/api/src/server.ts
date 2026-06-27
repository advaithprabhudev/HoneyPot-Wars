import { createServer } from 'http'
import { Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@honeypot-wars/shared'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { registerScanHandlers } from './sockets/scanSocket.js'
import { registerArenaHandlers } from './sockets/arenaSocket.js'

const app = createApp()
const httpServer = createServer(app)

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: env.CORS_ORIGIN, credentials: true },
  maxHttpBufferSize: 100 * 1024 * 1024, // 100 MB to support ZIP uploads via Socket.IO
})

io.on('connection', (socket) => {
  registerScanHandlers(socket)
  registerArenaHandlers(socket)
})

httpServer.listen(env.PORT, () => {
  console.log(`[server] listening on http://localhost:${env.PORT}`)
  if (env.OPENAI_API_KEY) {
    console.log('[server] OpenAI scan agent: ready')
  } else {
    console.log('[server] OpenAI scan agent: OPENAI_API_KEY not set — set it to enable /api/scan')
  }
})
