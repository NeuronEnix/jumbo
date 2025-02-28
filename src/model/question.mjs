import mongoose from "mongoose";
import { CommonSchema } from "../common/const.mjs"
const Schema = mongoose.Schema;

export const QuestionSchema = {
  ...CommonSchema,
  optionId: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
}

const questionDaoSchema = new Schema({
  questionText: { type: String },
  questionHash: { type: String, index: { unique: true } },
  options: [{ text: { type: String }, id: { type: Number }, _id: false }],
  correctOptionId: { type: Number },
  status: { type: Number, default: 1 },
});

export const QuestionDao = mongoose.model('question', questionDaoSchema);
