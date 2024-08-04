import WebSocket, { WebSocketServer } from 'ws';
import CONFIG from './common/config.mjs';
import { verifyAccessToken } from './lib/auth.mjs';
import { ResponseError } from './common/respond.mjs';
import { GAME_EVENT } from './common/const.mjs';
import { handleAnswerSubmitEvent, handleGameSubmitEvent } from './lib/wsEvent.mjs';

export const userWs = {}

const wss = new WebSocketServer({
  port: CONFIG.SERVER.WS_PORT,
});

console.log(`WebSocket at: ws://127.0.0.1:${CONFIG.SERVER.WS_PORT}`);

wss.on('connection', (ws, req) => {
  try {
    console.log("WebSocket con received")
    const tokenPayload = verifyAccessToken(req.headers.authorization)
    userWs[tokenPayload.id] = ws
    ws.userId = tokenPayload.id
    ws.on('message', async (payload) => {
      try {
        payload = JSON.parse(payload.toString())
        if (!payload?.event) return sendEvent(ws, { event: 'ERROR', data: { msg: 'Accepts only JSON' } })
          console.log(`WS: ${payload.event}`)

        payload.userId = ws.userId
        switch (payload.event) {
          case GAME_EVENT.ANSWER_SUBMIT.name: await handleAnswerSubmitEvent(payload); break;
          case GAME_EVENT.GAME_SUBMIT.name: await handleGameSubmitEvent(payload); break;
        }

      } catch (e) {
        if (e instanceof ResponseError)
          return sendEvent(ws, { event: 'ERROR', code: e.code, msg: e.msg, data: e.data })
        console.log(e)
        if (!payload?.event) ws.send(JSON.stringify({ event: 'ERROR', data: { msg: 'Accepts only JSON' } }))
      }
    })
  } catch (e) {
    if (e instanceof ResponseError) {
      sendEvent(ws, { event: 'ERROR', code: e.code, msg: e.msg, data: e.data })
      if (['INVALID_TOKEN', 'EXPIRED_ACCESS_TOKEN'].includes(e.code)) {
        disconnect(ws)
      }
    } else {
      disconnect(ws)
    }
  }
});

export const isUserConnected = (userId) => userWs[userId]
const sendEvent = (ws, data) => ws.send(JSON.stringify(data))
const disconnect = (ws) => {
  const userId = ws.userId
  if (userId) {
    delete userWs[userId]
  }
  ws.close()
}
export const sendEventToUser = (userId, data) => userWs[userId] && userWs[userId].send(JSON.stringify(data))
