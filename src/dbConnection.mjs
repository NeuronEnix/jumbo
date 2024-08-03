import mongoose from "mongoose";
import CONFIG from "./common/config.mjs";


// Fixes all deprecation warnings
const mongooseOption = {
  // useNewUrlParser: true,
  // useCreateIndex: true,
  // useUnifiedTopology: true,
  // autoIndex: true,
}

// Connects to DB
// const DB_URL = process.env.DB_URL || `mongodb://${CONFIG.DB.HOST}:${CONFIG.DB.PORT}/${CONFIG.DB.NAME}`;
const DB_URL = process.env.DB_URL || `mongodb://${CONFIG.DB.USER}:${CONFIG.DB.PASS}@${CONFIG.DB.HOST}:${CONFIG.DB.PORT}/${CONFIG.DB.NAME}?authSource=admin`;
export const connectToDatabase = () => {

  mongoose.connect(DB_URL, mongooseOption)
    .then(val => { console.log('Connected to DB'); })
    .catch(err => {
      console.log(err)
      console.log('Not Connected to DB', err.reason, console.log(Object.keys(err)));
    });

}
