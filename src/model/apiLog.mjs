import mongoose from "mongoose";
const Schema = mongoose.Schema;

export const apiLogDaoSchema = new Schema({
  ip: { type: String },
  method: { type: String },
  path: { type: String },
  userId: { type: String },
  totalTime: { type: Number },
  resCode: { type: String },
  reqData: { type: Schema.Types.Mixed },
  resData: { type: Schema.Types.Mixed },
  resInfo: { type: Schema.Types.Mixed },
  inTime: { type: Date },
  outTime: { type: Date }
});

export const ApiLogDao = mongoose.model('apiLog', apiLogDaoSchema);
