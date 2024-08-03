import Ajv from 'ajv';
import addFormats from "ajv-formats"


import { UserDao } from '../../../model/user.mjs';
import { resErr, resOk, ResponseError } from '../../../common/respond.mjs';
import { STATUS } from '../../../common/const.mjs';
import { addToQueue } from '../../../cron/handleGameInit.mjs';
import { isUserConnected } from '../../../webSocket.mjs';

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
      name: 1, status: 1
    })
    if (user.status !== STATUS.ACTIVE) throw resErr.auth.userInactive();
    if (!isUserConnected(req.user.id)) throw resErr.game.userNotConnected();
    addToQueue({userId: req.user.id, name: user.name});
    return resOk(res, { userId: req.user.id });
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
