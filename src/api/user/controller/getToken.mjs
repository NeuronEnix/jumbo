import Ajv from 'ajv';
import jwt from 'jsonwebtoken';

import { UserSchema, UserDao } from '../../../model/user.mjs';
import { resErr, resOk, ResponseError } from '../../../common/respond.mjs';
import { STATUS, AUTH } from '../../../common/const.mjs';
import { getNewAccessToken } from '../../../lib/auth.mjs';

const { JsonWebTokenError, TokenExpiredError } = jwt;

// Validation
const ajv = new Ajv({ allErrors: true });
const schema = {
  type: 'object',
  properties: {
    refreshToken: UserSchema.refreshToken,
  },
  required: ["refreshToken"],
  additionalProperties: false,
};
const ajvValidator = ajv.compile(schema);
async function validate(req, res, next) {
  const dataValidated = ajvValidator({
    refreshToken: req.cookies.refreshToken
  });
  if (!dataValidated) {
    return resErr.gen.invalidParam('', ajvValidator.errors).send(res);
  }
  next()
}

//  Logic
export async function execute(req, res) {
  try {

    // Verify refresh token
    const refreshToken = req.cookies.refreshToken
    const refreshTokenPayload = jwt.verify(refreshToken, AUTH.REFRESH_TOKEN_SECRET, { algorithms: ["HS256"] });
    const user = await UserDao.findById(
      refreshTokenPayload.id,
      { refreshTokenJti: 1, status: 1 }
    )

    if (!user || user.refreshTokenJti !== refreshTokenPayload.jti) {
      throw resErr.auth.invalidRefreshToken();
    }

    if (user.status !== STATUS.ACTIVE) {
      throw resErr.auth.userInactive();
    }

    const tokenObj = await getNewAccessToken(user.id);

    return resOk(res, { userId: user.id, accessToken: tokenObj.accessToken });

  } catch (e) {
    if (e instanceof ResponseError) {
      return e.send(res);
    } else if (e instanceof JsonWebTokenError || e instanceof TokenExpiredError) {
      return resErr.auth.invalidRefreshToken().send(res);
    }
    return resErr.gen.unknown(e).send(res);
  }
}

export default {
  validate,
  execute,
}
