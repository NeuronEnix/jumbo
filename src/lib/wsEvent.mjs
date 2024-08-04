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

/**
 * Send Question send event to all users
 * @param {Number} userId - userId of the user who received the event
 * @param {{_id: string, text: string, options: {id: number, text: string}[]}[]} questions - list of questions
 */
export function sendQuestionSendEvent(userId, questions) {
  userWs[userId] && userWs[userId].send(JSON.stringify({
    event: GAME_EVENT.QUESTION_SEND.name,
    data: {
      userId,
      questions
    }
  }))
}
