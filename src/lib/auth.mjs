import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { resErr, ResponseError } from '../common/respond.mjs';
import { AUTH } from '../common/const.mjs';


/**
 * @typedef {Object} T_AccessTokenPayload
 * @property {string} id - userId of user.
 * @property {string} jti - Json web token id.
 * @property {number} iat - issued at time in seconds.
 */


/**
 * @typedef {Object} T_RefreshTokenPayload
 * @property {string} id - userId of user.
 * @property {string} jti - Json web token id.
 * @property {number} iat - issued at time in seconds.
 */
/**
 * Retrieves a new refresh token for the user with the given phone number and password.
 *
 * @param {string} userId - userId of user.
 * @return {Promise<{id: number, refreshToken: string, refreshTokenPayload: T_RefreshTokenPayload}>} An object containing the user ID, the refresh token, and the refresh token payload.
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
 * @return {Promise<{userId: string, accessToken: string, accessTokenPayload: T_AccessTokenPayload}>} An object containing the userId, the access token, and the access token payload.
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


/**
 * Verifies the given access token and returns the access token payload.
 *
 * @param {string} token - The access token to verify.
 * @return {T_AccessTokenPayload} The access token payload.
 */
export function verifyAccessToken(token) {
  try {
    const accessTokenPayload = jwt.verify(token, AUTH.ACCESS_TOKEN_SECRET, {
      algorithms: ["HS256"]
    });
    return accessTokenPayload;
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      throw resErr.auth.expiredAccessToken(e)
    }
    throw resErr.auth.invalidAccessToken(e)
  }
}

export async function verifyAccessTokenExpress(req, res, next) {
  const { authorization } = req.headers;
  try {
    if (typeof authorization !== 'string') {
      return resErr.auth.invalidAccessToken().send(res);
    }
    req.user = verifyAccessToken(authorization);
    next();
  } catch (e) {
    if (e instanceof ResponseError) {
      e.send(res);
    }
    throw resErr.gen.unknown(e);
  }
}
