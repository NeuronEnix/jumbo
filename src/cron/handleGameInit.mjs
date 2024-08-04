import { GAME_CONFIG, STATUS } from "../common/const.mjs";
import { resErr } from "../common/respond.mjs";
import { sendGameEndEvent, sendGameInit, sendQuestionSendEvent } from "../lib/wsEvent.mjs";
import { GameSessionDao } from "../model/gameSession.mjs";
import { QuestionDao } from "../model/question.mjs";
import { UserDao } from "../model/user.mjs";

let counter = 0;
const prevVal = {
  userListLen: -1,
  gameSessionCount: -1
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
  if (userIdSet.has(userObj.userId)) {
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
      sendQuestionSendEvent(u.userId, gameSession.gameSessionId, {
        _id: gameSession.questionList[0]._id,
        text: gameSession.questionList[0].questionText,
        options: gameSession.questionList[0].options
      })
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
    timeoutAt: Date.now() + GAME_CONFIG.MAX_GAME_TIME_MS,
    users: userList.map((u) => ({ _id: u.userId })),
  })
  await UserDao.updateMany({ _id: { $in: userList.map((u) => u.userId) } }, { $set: { gameSessionId: gameSession._id } })
  return {
    gameSessionId: gameSession._id,
    questionList
  }
}

let timeoutCounter = 0
export async function handleGameTimeout() {
  const gameSessions = await GameSessionDao.find({ status: STATUS.ACTIVE });
  ++timeoutCounter
  if (gameSessions.length !== prevVal.gameSessionCount) {
    console.log(`handleGameTimeout(${timeoutCounter}): ${gameSessions.length} gameSessions`)
    prevVal.gameSessionCount = gameSessions.length
  }
  gameSessions.forEach(async gs => {
    if (gs.timeoutAt > Date.now()) {
      const questionList = await QuestionDao.find({ _id: { $in: gs.questionIds } });
      gs.users.forEach(gameUser => {
        gameUser.gameSubmitted = true;
        gameUser.score = gameUser.answers.reduce((prev, cur) => {
          const question = questionList.find((q) => q._id.equals(cur.questionId));
          if (question.correctOptionId == cur.chosenOptionId) prev += 1
          return prev
        }, 0)
      })
      gs.status = STATUS.COMPLETED;
      gs.save()
        .catch((err) => { console.log(err) })

      UserDao.updateMany(
        { _id: { $in: gs.users.map((u) => u._id) } },
        { $set: { gameSessionId: null } }
      ).catch((err) => { console.log(err) })
      sendGameEndEvent(gs)
    }
  })
  setTimeout(handleGameTimeout, 5000);
}
