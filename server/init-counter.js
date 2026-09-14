require("dotenv").config();
const { MongoClient } = require("mongodb");
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db();
    const counters = db.collection("counters");
    await counters.updateOne(
      { _id: "registration" },
      { $setOnInsert: { seq: 10 } },
      { upsert: true }
    );
    console.log("Counter initialized successfully.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
run();
