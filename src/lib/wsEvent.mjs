import { GAME_EVENT } from "../common/const.mjs";
import { userWs } from "../webSocket.mjs";


/**
 * Send game init event to all users
 * @param {Object} data
 * @param {Array<Object>} data.users
 * @param {string} data.users[].userId
 * @param {string} data.users[].name
 */
export function sendGameInit(data) {
  data.users.forEach((u) => {
    userWs[u.userId] && userWs[u.userId].send(JSON.stringify({
      event: GAME_EVENT.GAME_INIT.name,
      data
    }))
  })
}
