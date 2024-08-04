export const STATUS = {
  ACTIVE: 1,
  DELETED: 2,
  NOT_REGISTERED: 3,
  COMPLETED: 3
};

export const CommonSchema = {

  // Db fields
  _id: { type: 'string', minLength: 24, maxLength: 24 },
  status: { type: 'integer', minimum: 1 },

  // Pagination fields
  limit: { type: 'number', minimum: 1, maximum: 50 },
  pageNumber: { type: 'number', minimum: 1, maximum: 1000 },

};

export const AUTH = {
  BCRYPT_SALT_ROUNDS: 10,
  MAX_SESSION: 5,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'secret-1',
  ACCESS_TOKEN_EXPIRE: '1h',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'secret-2',
  REFRESH_TOKEN_EXPIRE: '30d',
  REFRESH_TOKEN_EXPIRE_COOKIE : 30 * 24 * 60 * 60 * 100,
};

export const GAME_EVENT = {
  GAME_INIT: {
    name: "game:init"
  },
  QUESTION_SEND: {
    name: "question:send"
  },
  QUESTION_COMPLETE: {
    name: "question:complete"
  },
  ANSWER_SUBMIT: {
    name: "answer:submit"
  },
  GAME_SUBMIT: {
    name: "game:submit"
  },
  USER_SUBMITTED: {
    name: "user:submitted"
  },
  GAME_END: {
    name: "game:end"
  }
}

export const GAME_CONFIG = {
  MAX_USER_COUNT: 2,
  MAX_TIME_SEC: 2*60, // 2 minutes
  MAX_QUESTION: 2
}
