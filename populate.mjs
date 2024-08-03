import md5 from "md5";
import { connectToDatabase } from "./src/dbConnection.mjs";
import { QuestionDao } from "./src/model/question.mjs";

const dbCon = await connectToDatabase();

const questionList = [
  {
    questionText: "Capital of India",
    options: [
      { text: "Delhi" },
      { text: "Mumbai" },
      { text: "Chennai" },
      { text: "Bangalore" },
    ],
    correctOptionId: 1
  },
].map((q) => ({ ...q, questionHash: md5(q.questionText) }));
try {
  const res = await QuestionDao.insertMany(questionList)
  console.log("Populated")
} catch (e) {
  if ( e.code === 11000 ) {
    console.log("Already populated")
  }
}

await dbCon.disconnect()
