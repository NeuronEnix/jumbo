import { GAME_CONFIG } from "../common/const.mjs";
import { resErr } from "../common/respond.mjs";
import { sendGameInit } from "../lib/wsEvent.mjs";
let counter = 0;

/**
 * @typedef {Object} T_UserObj
 * @property {string} userId
 * @property {string} name
 */

/**
 * @type {T_UserObj[]}
 */
const userList = [];
const userIdSet = new Set();


/**
 * @param userObj {T_UserObj}
 */
export function addToQueue(userObj) {
  if (userIdSet.has(userObj)) {
    throw resErr.game.alreadyInQueue();
  }
  userList.push(userObj);
  userIdSet.add(userObj.userId);
}

export async function handleGameInit() {
  console.log(`handleGameInit(${++counter}): ${userList.length} users`)
  while (userList.length >= GAME_CONFIG.MAX_USER_COUNT) {
    const gameUsers = userList.splice(0, GAME_CONFIG.MAX_USER_COUNT);
    gameUsers.forEach((u) => userIdSet.delete(u));
    sendGameInit({
      users: gameUsers
    })
  }
  setTimeout(handleGameInit, 1000);
}
