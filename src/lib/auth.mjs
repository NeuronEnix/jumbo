import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { resErr } from '../common/respond.mjs';
import { AUTH } from '../common/const.mjs';


/**
 * Retrieves a new refresh token for the user with the given phone number and password.
 *
 * @param {string} userId - userId of user.
 * @return {Promise<{id: number, refreshToken: string, refreshTokenPayload: {id: number, jti: string, iat: number}}>} An object containing the user ID, the refresh token, and the refresh token payload.
 */
export async function getNewRefreshToken(userId) {

  const refreshTokenPayload = {
    id: userId,
    jti: randomUUID(),
    iat: parseInt((Date.now() / 1000).toString(), 10),
  };

  const refreshToken = jwt.sign(
    refreshTokenPayload,
    AUTH.REFRESH_TOKEN_SECRET,
    { expiresIn: AUTH.REFRESH_TOKEN_EXPIRE },
  );

  return {
    userId: userId,
    refreshToken,
    refreshTokenPayload
  };
}

/**
 * Retrieves a new access token for the user with the given userId.
 *
 * @param {string} userId - The userId of the user.
 * @return {Promise<{userId: string, accessToken: string, accessTokenPayload: {id: string, jti: string, iat: number}}>} An object containing the userId, the access token, and the access token payload.
 */
export async function getNewAccessToken(userId) {

  const accessTokenPayload = {
    id: userId,
    jti: randomUUID(),
    iat: parseInt((Date.now() / 1000).toString(), 10),
  };

  const accessToken = jwt.sign(
    accessTokenPayload,
    AUTH.ACCESS_TOKEN_SECRET,
    { expiresIn: AUTH.ACCESS_TOKEN_EXPIRE },
  );

  return {
    userId: userId,
    accessToken,
    accessTokenPayload
  };
}

export async function verifyAccessToken(req, res, next) {
  const { authorization } = req.headers;
  try {
    if (typeof authorization !== 'string') {
      return resErr.auth.invalidAccessToken().send(res);
    }
    const accessTokenPayload = jwt.verify(authorization.replace("Bearer ", ""), AUTH.ACCESS_TOKEN_SECRET, {
      algorithms: ["HS256"]
    });
    req.user = accessTokenPayload;
    next();
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      return resErr.auth.expiredAccessToken().send(res);
    }
    return resErr.auth.invalidAccessToken(e).send(res);
  }
}
