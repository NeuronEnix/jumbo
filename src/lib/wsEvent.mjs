import Ajv from 'ajv';

import { CommonSchema, GAME_EVENT } from "../common/const.mjs";
import { sendEventToUser, userWs } from "../webSocket.mjs";
import { QuestionDao, QuestionSchema } from '../model/question.mjs';
import { GameSessionDao } from '../model/gameSession.mjs';
import { resErr } from '../common/respond.mjs';
import { UserDao } from '../model/user.mjs';

const ajv = new Ajv({ allErrors: true });

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
 * Send Question event
 * @param {String} userId - userId of the user who received the event
 * @param {String} gameSessionId - Game session ID
 * @param {{_id: string, text: string, options: {id: number, text: string}[]}} question - question
 */
export function sendQuestionSendEvent(userId, gameSessionId, question) {
  sendEventToUser(userId, {
    event: GAME_EVENT.QUESTION_SEND.name,
    userId,
    data: {
      gameSessionId,
      question: {
        questionId: question._id,
        text: question.text,
        options: question.options
      }
    }
  })
}

/**
 * Send user done event
 * @param {String[]} userId
 * @param {String} gameSessionId - Game session ID
 */
export function sendUserDoneEvent(userId, allUserIds, gameSessionId) {
  allUserIds.forEach((uid) => {
    sendEventToUser(uid, {
      event: GAME_EVENT.USER_SUBMITTED.name,
      userId: uid,
      data: { submittedByUserId: userId, gameSessionId, }
    })
  })
}

/**
 * Send game end event
 * @param {GameSessionDao} gameSession - Game session ID
 */
export async function sendGameEndEvent(gameSession) {
  gameSession.users.sort((a, b) => b.score - a.score)
  const isDraw = gameSession.users[0].score === gameSession.users[1].score
  const winnerId = isDraw ? null : gameSession.users[0]._id
  const users = await UserDao.find({ _id: { $in: gameSession.users.map(u => u._id) } })

  gameSession.users.forEach(u => {
    sendEventToUser(u._id, {
      event: GAME_EVENT.GAME_END.name,
      userId: u._id,
      data: {
        isDraw, winnerId, gameSessionId: gameSession._id,
        users: gameSession.users.map( u => ({
          userId: u._id,
          name: users.find(user => user._id.equals(u._id)).name,
          score: u.score
        }))
      }
    })
  })
}

const answerSubmitValidator = ajv.compile({
  type: 'object',
  properties: {
    gameSessionId: CommonSchema._id,
    questionId: CommonSchema._id,
    chosenOptionId: QuestionSchema.optionId
  },
  required: ['gameSessionId', 'questionId', 'chosenOptionId'],
  additionalProperties: false,
});
/**
 * Handle answer submit event
 * @param {Object} payload
 * @param {string} payload.event
 * @param {string} payload.userId
 * @param {Object} payload.data
 * @param {string} payload.data.gameSessionId
 * @param {string} payload.data.questionId
 * @param {number} payload.data.chosenOptionId
 */
export async function handleAnswerSubmitEvent(payload) {
  const { userId, data } = payload
  const dataValidated = answerSubmitValidator(data);
  if (!dataValidated) {
    throw resErr.gen.invalidParam('', answerSubmitValidator.errors)
  }
  const gameSession = await GameSessionDao.findById(data.gameSessionId);

  // Handle validation
  if (!gameSession) throw resErr.game.notFound();
  if (!gameSession.users.find((u) => u._id == userId)) throw resErr.game.userNotInGame();
  if (!gameSession.questionIds.includes(data.questionId)) throw resErr.game.invalidQuestion();

  // Save answer
  const answerList = gameSession.users.find((u) => u._id == userId).answers;
  const alreadyAnswered = answerList.find((o) => o.questionId == data.questionId);
  if (alreadyAnswered) alreadyAnswered.chosenOptionId = data.chosenOptionId;
  else answerList.push({ questionId: data.questionId, chosenOptionId: data.chosenOptionId });
  await gameSession.save();

  // if this is a new answer, send next question if needed
  if (!alreadyAnswered && answerList.length < gameSession.questionIds.length) {
    const question = await QuestionDao.findById(
      gameSession.questionIds[answerList.length],
      { questionText: 1, options: 1 }
    );
    sendQuestionSendEvent(userId, data.gameSessionId, {
      _id: question._id,
      text: question.questionText,
      options: question.options
    });
  }
}

const gameSubmitValidator = ajv.compile({
  type: 'object',
  properties: {
    gameSessionId: CommonSchema._id,
  },
  required: ['gameSessionId'],
  additionalProperties: false,
});

/**
 * Handle game submit event
 * @param {Object} payload
 * @param {string} payload.event
 * @param {string} payload.userId
 * @param {Object} payload.data
 * @param {string} payload.data.gameSessionId
 */
export async function handleGameSubmitEvent(payload) {
  const { userId, data } = payload
  const dataValidated = gameSubmitValidator(data);
  if (!dataValidated) {
    console.log(answerSubmitValidator.errors)
    throw resErr.gen.invalidParam('', answerSubmitValidator.errors)
  }
  const gameSession = await GameSessionDao.findById(data.gameSessionId);

  // Handle validation
  if (!gameSession) throw resErr.game.notFound();
  const gameUser = gameSession.users.find((u) => u._id == userId)
  if (!gameUser) throw resErr.game.userNotInGame();
  if (gameSession.questionIds.length != gameUser.answers.length) throw resErr.game.notAllQuestionAnswered();
  // if (gameUser.gameSubmitted) throw resErr.game.alreadySubmitted();

  // Calculate score
  const questionList = await QuestionDao.find({ _id: { $in: gameSession.questionIds } });
  gameUser.gameSubmitted = true;
  gameUser.score = gameUser.answers.reduce((prev, cur) => {
    const question = questionList.find((q) => q._id.equals(cur.questionId));
    if (question.correctOptionId == cur.chosenOptionId) prev += 1
    return prev
  }, 0)

  await gameSession.save();

  sendUserDoneEvent(userId, gameSession.users.map((u) => u._id), data.gameSessionId)
  const submittedUserCount = gameSession.users.filter((u) => u.gameSubmitted).length
  if (submittedUserCount != gameSession.users.length) return
  sendGameEndEvent(gameSession)
}
