
export class ResponseError extends Error {
  constructor({
    code = 'UNKNOWN_ERROR', msg = 'Something went wrong', data = {}, info = {},
  } = {}) {
    super(code);
    this.name = code;
    this.code = code;
    this.msg = msg;
    this.data = data;
    this.info = info;
  }
  send(resObj) {
    const httpCode = this.code == "UNKNOWN_ERROR" ? 500 : 400

    if (this.info) console.log(this.info)
    resObj.status(httpCode).send({
      code: this.code,
      msg: this.msg,
      data: this.data,
    })
    resObj.outbound(resObj, this.code, this.data, this.info)
  }
}

export const resOk = (resObj, data = {}) => {
  resObj.status(200).send({
    code: 'OK',
    msg: 'OK',
    data: data,
  })
  resObj.outbound(resObj, "OK", data)
}

export const resErr = {
  gen: {
    unknown: (err) => {
      console.log(err)
      return new ResponseError({ msg: 'Something went wrong' })
    },

    invalidParam: (msg, info = {}) => new ResponseError({
      code: 'INVALID_PARAM',
      msg: msg || `${info[0].instancePath.replace("/", "")}: ${info[0].message}`,
      info,
    }),
    invalidRequestData: (msg, info = {}) => new ResponseError({
      code: 'INVALID_REQUEST_DATA',
      msg: msg || 'Invalid request data',
      info,
    }),
  },

  auth: {
    invalidAccessToken: () => new ResponseError({
      code: 'INVALID_TOKEN',
      msg: 'Invalid token',
    }),
    expiredAccessToken: () => new ResponseError({
      code: 'EXPIRED_ACCESS_TOKEN',
      msg: 'Expired access token',
    }),
    invalidRefreshToken: () => new ResponseError({
      code: 'INVALID_REFRESH_TOKEN',
      msg: 'Invalid refresh token',
    }),
    userNotFound: () => new ResponseError({
      code: 'USER_NOT_FOUND',
      msg: 'User not found',
    }),
    userInactive: () => new ResponseError({
      code: 'USER_INACTIVE',
      msg: 'User is not active',
    }),
    invalidCredential: () => new ResponseError({
      code: 'INVALID_CREDENTIAL',
      msg: 'Invalid credential',
    }),
    userAlreadyExist: () => new ResponseError({
      code: 'USER_ALREADY_EXIST',
      msg: 'Account already exists',
    }),
  },
  game: {
    alreadyInQueue: () => new ResponseError({
      code: 'USER_ALREADY_IN_QUEUE',
      msg: 'User already in queue',
    }),
    userNotConnected: () => new ResponseError({
      code: 'USER_NOT_CONNECTED',
      msg: 'User not connected to websocket, please connect',
    }),
  }
};
