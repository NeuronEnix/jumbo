import dotenv from 'dotenv'
process.env.DISABLE_DOTENV === "true" || dotenv.config();
const CONFIG = {
  NODE_ENV : process.env.NODE_ENV ?? 'dev',
  SERVER: {
    API_PORT: parseInt(process.env.API_PORT ?? '3000', 10),
    WS_PORT: parseInt(process.env.WS_PORT ?? '3001', 10),
  },
  DB: {
    HOST: process.env.DB_HOST ?? 'localhost',
    PORT: parseInt(process.env.DB_PORT ?? '27017', 10),
    USER: process.env.DB_USER ?? 'root',
    PASS: process.env.DB_PASS ?? 'pass123',
    NAME: process.env.DB_NAME ?? 'jumbo',
  }
};

export default CONFIG;
