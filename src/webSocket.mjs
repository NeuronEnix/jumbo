import WebSocket, { WebSocketServer } from 'ws';
import CONFIG from './common/config.mjs';
import { verifyAccessToken } from './lib/auth.mjs';
import { ResponseError } from './common/respond.mjs';

export const userWs = {}

const wss = new WebSocketServer({
  port: CONFIG.SERVER.WS_PORT,
});

console.log(`WebSocket at: ${CONFIG.SERVER.WS_PORT}`);

wss.on('connection', (ws, req) => {
  try {
    const tokenPayload = verifyAccessToken(req.headers.authorization)
    userWs[tokenPayload.id] = ws
  } catch (e) {
    if ( e instanceof ResponseError ) {
      console.log(e.msg)
    }
    ws.close()
  }
});
