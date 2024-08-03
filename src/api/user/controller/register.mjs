import Ajv from 'ajv';
import addFormats from "ajv-formats"

import { hash as hashPass } from 'bcrypt';

import { UserSchema, UserDao } from '../../../model/user.mjs';
import { resErr, resOk, ResponseError } from '../../../common/respond.mjs';
import { AUTH, STATUS } from '../../../common/const.mjs';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv)

const schema = {
  type: 'object',
  properties: {
    email: UserSchema.email,
    pass: UserSchema.pass,
    name: UserSchema.name,
  },
  required: ['email', 'name', 'pass'],
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
    const hashedPass = await hashPass(data.pass, AUTH.BCRYPT_SALT_ROUNDS);
    const user = await UserDao.create({
      email: data.email,
      name: data.name,
      pass: hashedPass,
      status: STATUS.ACTIVE
    })
      .catch(async e => {
        if ( e.code == 11000 ) {
          throw resErr.auth.userAlreadyExist();
        }
        throw e
      });
    return resOk(res, user);

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
