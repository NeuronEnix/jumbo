import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';

import {} from "./webSocket.mjs"
import { resOk, resErr } from "./common/respond.mjs"
import CONFIG from "./common/config.mjs"
import appRouter from "./api/index.mjs"
import { connectToDatabase} from "./dbConnection.mjs"
import { inbound } from './common/logger.mjs';

const app = express();
await connectToDatabase()

app.use(helmet())
app.use(cors({
  origin: '*', // ["https://jumbo.kaushikrb.com"]
  methods: '*', // ["GET", "POST", "OPTIONS"]
  preflightContinue: false,
  optionsSuccessStatus: 204,
  allowedHeaders: '*', // ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json({limit: '1mb'}));
app.use(inbound) // To log request

app.use(appRouter) // To handle request

app.get("/ping", (req, res) => {
  resOk(res, { ping: "pong", date: new Date() })
});

app.use((err, req, res, next) => {
  // handle invalid json
  if (err instanceof SyntaxError) {
    return resErr.gen.invalidRequestData().send(res);
  }
});

app.listen(CONFIG.SERVER.API_PORT, () => {
  console.log(`Server at: http://localhost:${CONFIG.SERVER.API_PORT}`);
});
