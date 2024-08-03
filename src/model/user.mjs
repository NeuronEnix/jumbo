import mongoose from "mongoose";
import {CommonSchema} from "../common/const.mjs"
const Schema = mongoose.Schema;

export const UserSchema = {
  ...CommonSchema,
  email: { type: 'string', format: 'email' },
  pass: { type: 'string', minLength: 8, maxLength: 20, },
  name: { type: 'string', minLength: 5, maxLength: 50 },
  refreshToken: { type: 'string', minLength: 5, maxLength: 500 }
}

const userDaoSchema = new Schema({
  email: { type: String, index: { unique: true } },
  pass: { type: String },
  name: { type: String },
  status: { type: Number },
});

export const UserDao = mongoose.model('user', userDaoSchema);
