import md5 from "md5";
import { connectToDatabase } from "./src/dbConnection.mjs";
import { QuestionDao } from "./src/model/question.mjs";

const dbCon = await connectToDatabase();

const questionList = [
  {
    questionText: "Capital of India",
    options: [
      { id: 1, text: "Delhi" },
      { id: 2, text: "Mumbai" },
      { id: 3, text: "Chennai" },
      { id: 4, text: "Bangalore" },
    ],
    correctOptionId: 1
  },
  {
    questionText: "Capital of USA",
    options: [
      { id: 1, text: "New York" },
      { id: 2, text: "Los Angeles" },
      { id: 3, text: "Washington D.C" },
      { id: 4, text: "Houston" },
    ],
    correctOptionId: 3
  },
  {
    questionText: "Capital of Japan",
    options: [
      { id: 1, text: "Osaka" },
      { id: 2, text: "Tokyo" },
      { id: 3, text: "Kyoto" },
      { id: 4, text: "Sapporo" },
    ],
    correctOptionId: 2
  },
  {
    questionText: "Capital of China",
    options: [
      { id: 1, text: "Beijing" },
      { id: 2, text: "Shanghai" },
      { id: 3, text: "Guangzhou" },
      { id: 4, text: "Shenzhen" },
    ],
    correctOptionId: 1
  },
  {
    questionText: "Capital of France",
    options: [
      { id: 1, text: "Marseille" },
      { id: 2, text: "Lyon" },
      { id: 3, text: "Nice" },
      { id: 4, text: "Paris" },
    ],
    correctOptionId: 4
  },
  {
    questionText: "Capital of Germany",
    options: [
      { id: 1, text: "Hamburg" },
      { id: 2, text: "Munich" },
      { id: 3, text: "Berlin" },
      { id: 4, text: "Cologne" },
    ],
    correctOptionId: 3
  },
  {
    questionText: "Capital of Brazil",
    options: [
      { id: 1, text: "Sao Paulo" },
      { id: 2, text: "Brasilia" },
      { id: 3, text: "Rio de Janeiro" },
      { id: 4, text: "Salvador" },
    ],
    correctOptionId: 2
  },
  {
    questionText: "Capital of Russia",
    options: [
      { id: 1, text: "Moscow" },
      { id: 2, text: "Saint Petersburg" },
      { id: 3, text: "Kazan" },
      { id: 4, text: "Novosibirsk" },
    ],
    correctOptionId: 1
  },
  {
    questionText: "Capital of Australia",
    options: [
      { id: 1, text: "Sydney" },
      { id: 2, text: "Canberra" },
      { id: 3, text: "Melbourne" },
      { id: 4, text: "Perth" },
    ],
    correctOptionId: 2
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
