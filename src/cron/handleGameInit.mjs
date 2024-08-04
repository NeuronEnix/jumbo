import { GAME_CONFIG } from "../common/const.mjs";
import { resErr } from "../common/respond.mjs";
import { sendGameInit, sendQuestionSendEvent } from "../lib/wsEvent.mjs";
import { GameSessionDao } from "../model/gameSession.mjs";
import { QuestionDao } from "../model/question.mjs";

let counter = 0;
const prevVal = {
  userListLen: -1
}

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
  ++counter
  if (userList.length !== prevVal.userListLen) {
    console.log(`handleGameInit(${counter}): ${userList.length} users`)
    prevVal.userListLen = userList.length
  }
  while (userList.length >= GAME_CONFIG.MAX_USER_COUNT) {
    const gameUsers = userList.splice(0, GAME_CONFIG.MAX_USER_COUNT);
    gameUsers.forEach((u) => userIdSet.delete(u));
    const gameSession = await createGameSession(gameUsers);
    sendGameInit({
      users: gameUsers
    })
    gameUsers.forEach((u) => {
      sendQuestionSendEvent( u.userId, gameSession.gameSessionId, gameSession.questionList[0] )
    });
  }
  setTimeout(handleGameInit, 1000);
}

async function getRandomQuestion(questionCount) {
  const questionList = await QuestionDao.find({}, { _id: 1, questionText: 1, options: 1 });
  return questionList.sort(() => Math.random() - 0.5).slice(0, questionCount);
}

async function createGameSession(userList) {
  const questionList = await getRandomQuestion(GAME_CONFIG.MAX_QUESTION);
  const gameSession = await GameSessionDao.create({
    questionIds: questionList,
    users: userList.map((u) => ({ _id: u.userId })),
  })
  return {
    gameSessionId: gameSession._id,
    questionList
  }
}
