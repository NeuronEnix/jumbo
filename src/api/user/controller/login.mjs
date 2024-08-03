import Ajv from 'ajv';
import addFormats from "ajv-formats"

import { compare as comparePass } from 'bcrypt';

import { UserSchema, UserDao } from '../../../model/user.mjs';
import { resErr, resOk, ResponseError } from '../../../common/respond.mjs';
import { STATUS, AUTH } from '../../../common/const.mjs';
import { getNewRefreshToken } from '../../../lib/auth.mjs';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv)

const schema = {
  type: 'object',
  properties: {
    email: UserSchema.email,
    pass: UserSchema.pass,
  },
  required: ['email', 'pass'],
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

    const user = await UserDao.findOne(
      { email: data.email },
      { email: 1, pass: 1, status: 1 }
    )

    if (!user) throw resErr.auth.invalidCredential();
    if (user.status !== STATUS.ACTIVE) throw resErr.auth.userInactive();

    const isPassOk = await comparePass(data.pass, user.pass);
    if (!isPassOk) throw resErr.auth.invalidCredential();

    // Create new refresh token
    const tokenObj = await getNewRefreshToken(user.id);
    user.refreshTokenJti = tokenObj.refreshTokenPayload.jti;
    await user.save();

    // Attach refresh token to cookie marked http only
    const refreshTokenCookieProperty = { maxAge: AUTH.REFRESH_TOKEN_EXPIRE_COOKIE, httpOnly: true };
    res.cookie('refreshToken', tokenObj.refreshToken, refreshTokenCookieProperty);

    return resOk(res, { userId: tokenObj.userId });

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
