import Ajv from 'ajv';

import { CommonSchema, GAME_EVENT } from "../common/const.mjs";
import { sendEventToUser, userWs } from "../webSocket.mjs";
import { QuestionDao, QuestionSchema } from '../model/question.mjs';
import { GameSessionDao } from '../model/gameSession.mjs';
import { resErr } from '../common/respond.mjs';

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
      event: GAME_EVENT.USER_DONE.name,
      userId: uid,
      data: { gameSubmittedByUserId: userId, gameSessionId, }
    })
  })
}

const answerSubmitValidator = ajv.compile({
  type: 'object',
  properties: {
    event: { type: 'string', enum: [GAME_EVENT.ANSWER_SUBMIT.name] },
    userId: CommonSchema._id,
    gameSessionId: CommonSchema._id,
    questionId: CommonSchema._id,
    chosenOptionId: QuestionSchema.optionId
  },
  required: ['event', 'userId', 'gameSessionId', 'questionId', 'chosenOptionId'],
  additionalProperties: false,
});
/**
 * Handle answer submit event
 * @param {Object} data
 * @param {string} data.event
 * @param {string} data.userId
 * @param {string} data.gameSessionId
 * @param {string} data.questionId
 * @param {number} data.chosenOptionId
 */
export async function handleAnswerSubmitEvent(data) {
  const dataValidated = answerSubmitValidator(data);
  if (!dataValidated) {
    throw resErr.gen.invalidParam('', answerSubmitValidator.errors)
  }
  const gameSession = await GameSessionDao.findById(data.gameSessionId);

  // Handle validation
  if (!gameSession) throw resErr.game.notFound();
  if (!gameSession.users.find((u) => u._id == data.userId)) throw resErr.game.userNotInGame();
  if (!gameSession.questionIds.includes(data.questionId)) throw resErr.game.invalidQuestion();

  // Save answer
  const answerList = gameSession.users.find((u) => u._id == data.userId).answers;
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
    sendQuestionSendEvent(data.userId, data.gameSessionId, {
      _id: question._id,
      text: question.questionText,
      options: question.options
    });
  }
}

const gameSubmitValidator = ajv.compile({
  type: 'object',
  properties: {
    event: { type: 'string', enum: [GAME_EVENT.GAME_SUBMIT.name] },
    userId: CommonSchema._id,
    gameSessionId: CommonSchema._id,
  },
  required: ['event', 'userId', 'gameSessionId'],
  additionalProperties: false,
});

/**
 * Handle game submit event
 * @param {Object} data
 * @param {string} data.event
 * @param {string} data.userId
 * @param {string} data.gameSessionId
 */
export async function handleGameSubmitEvent(data) {
  const dataValidated = gameSubmitValidator(data);
  if (!dataValidated) {
    throw resErr.gen.invalidParam('', answerSubmitValidator.errors)
  }
  const gameSession = await GameSessionDao.findById(data.gameSessionId);

  // Handle validation
  if (!gameSession) throw resErr.game.notFound();
  const gameUser = gameSession.users.find((u) => u._id == data.userId)
  if (!gameUser) throw resErr.game.userNotInGame();

  // Save answer
  gameUser.gameSubmitted = true;
  await gameSession.save();
  sendUserDoneEvent(data.userId, gameSession.users.map((u) => u._id), data.gameSessionId)
}
