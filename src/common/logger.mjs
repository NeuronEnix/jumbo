import { ApiLogDao } from "../model/apiLog.mjs"
import jwt from 'jsonwebtoken';
import { AUTH } from './const.mjs';

let counter = 0;

export async function inbound(req, res, next) {
  console.log(`${new Date().toISOString()} | ${++counter} | ${req.method} ${req.path}`)
  if (process.env.ENABLE_LOG !== "true") {
    res.outbound = () => { }
    return next()
  }

  res.inboundTs = performance.now()
  let data = {}
  if (req.method == "POST") {
    data.reqData = req.body
  } else if (req.method == "GET") {
    data.reqData = req.query
  }
  data.ip = req.ip
  data.method = req.method
  data.path = req.path
  data.inTime = new Date()
  try {
    const { authorization } = req.headers;
    if (typeof authorization === 'string') {
      const accessTokenPayload = jwt.verify(authorization.replace("Bearer ", ""), AUTH.ACCESS_TOKEN_SECRET, { algorithms: ["HS256"] });
      data.userId = accessTokenPayload.id
    }
  } catch (e) { e }
  res.logObj = ApiLogDao.create(data)
    .catch(e => {
      console.log("API_LOG_ERROR: INBOUND")
      console.log(e)
    })
  res.outbound = outbound
  next()
}

async function outbound(res, code, data, info = {}) {
  if (process.env.ENABLE_LOG != "true") return
  const logObj = await res.logObj
  ApiLogDao.findByIdAndUpdate(
    logObj._id,
    {
      outTime: new Date(),
      totalTime: performance.now() - res.inboundTs,
      resCode: code,
      resData: data,
      resInfo: info
    })
    .catch(e => {
      console.log("API_LOG_ERROR: OUTBOUND")
      console.log(e)
    })
}
