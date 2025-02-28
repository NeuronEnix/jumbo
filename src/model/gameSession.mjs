import mongoose from "mongoose";
import { CommonSchema, STATUS } from "../common/const.mjs"
const Schema = mongoose.Schema;

export const GameSessionSchema = {
  ...CommonSchema,
  optionId: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
}

const gameSessionDaoSchema = new Schema({
  questionIds: [{ type: Schema.Types.ObjectId, ref: 'QuestionDao' }],
  users: [{
    _id: { type: Schema.Types.ObjectId, ref: 'UserDao' },
    answers: {
      type: [{
        questionId: { type: Schema.Types.ObjectId, ref: 'QuestionDao' },
        chosenOptionId: { type: Number },
        _id: false
      }],
      default: []
    },
    gameSubmitted: { type: Boolean, default: false },
    score: { type: Number, default: 0 }
  }],
  timeoutAt: { type: Date },
  status: { type: Number, default: STATUS.ACTIVE },
});

export const GameSessionDao = mongoose.model('gameSession', gameSessionDaoSchema);
