import Ajv from 'ajv';
import addFormats from "ajv-formats"


import { UserDao } from '../../../model/user.mjs';
import { resErr, resOk, ResponseError } from '../../../common/respond.mjs';
import { STATUS } from '../../../common/const.mjs';
import { addToQueue } from '../../../cron/handleGameInit.mjs';
import { isUserConnected } from '../../../webSocket.mjs';
import { GameSessionDao } from '../../../model/gameSession.mjs';
import { QuestionDao } from '../../../model/question.mjs';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv)

const schema = {
  type: 'object',
  properties: {},
  required: [],
  additionalProperties: false,
};

const ajvValidator = ajv.compile(schema);

async function validate(req, res, next) {
  const dataValidated = ajvValidator(req.body);
  if (!dataValidated) {
    return resErr.gen.invalidParam('', ajvValidator.errors).send(res);
  }
  next()
}


export async function execute(req, res) {
  const data = req.body;
  try {
    const user = await UserDao.findById(req.user.id, {
      name: 1, status: 1, gameSessionId: 1
    })
    if (user.status !== STATUS.ACTIVE) throw resErr.auth.userInactive();
    if (!isUserConnected(req.user.id)) throw resErr.game.userNotConnected();
    if (!user.gameSessionId) return resOk(res, {});
    const gameSession = await GameSessionDao.findById(user.gameSessionId);
    if (!gameSession || gameSession.status !== STATUS.ACTIVE) {
      user.gameSessionId = null;
      await user.save();
      return resOk(res, {});
    }
    const questions = await QuestionDao.find(
      { _id: { $in: gameSession.questionIds } },
      { questionText: 1, options: 1 }
    );
    const gameUser = gameSession.users.find((u) => u._id == req.user.id)
    const resData = {
      userId: req.user.id,
      gameSessionId: gameSession._id,
      questions: gameUser.answers.map( ans => ({
        questionId: ans.questionId,
        questionText: questions.find((q) => q._id.equals(ans.questionId)).questionText,
        options: questions.find((q) => q._id.equals(ans.questionId)).options,
        chosenOptionId: ans.chosenOptionId
      })),
      gameSubmitted: gameUser.gameSubmitted
    }
    if ( resData.questions.length < gameSession.questionIds.length ) {
      const nextQuestionId = gameSession.questionIds[ resData.questions.length ];
      resData.questions.push({
        questionId: nextQuestionId,
        questionText: questions.find((q) => q._id.equals(nextQuestionId)).questionText,
        options: questions.find((q) => q._id.equals(nextQuestionId)).options,
        chosenOptionId: null
      })
    }
    return resOk(res, resData );
  } catch (e) {
    if (e instanceof ResponseError) {
      return e.send(res);
    }
    return resErr.gen.unknown(e).send(res);
  }
}

export default {
  validate,
  execute,
}
