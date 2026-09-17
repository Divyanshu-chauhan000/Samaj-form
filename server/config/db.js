const mongoose = require("mongoose");
const Submission = require("../models/Submission");

const syncRegistrationCounter = async () => {
  const records = await Submission.find(
    {},
    { registrationId: 1, _id: 0 },
  ).lean();
  const maxSerial = records.reduce(
    (max, record) =>
      Math.max(
        max,
        Number(
          String(record.registrationId || "")
            .split("-")
            .pop(),
        ) || 0,
      ),
    0,
  );
  await mongoose.connection.db
    .collection("counters")
    .updateOne(
      { _id: "registration" },
      { $set: { seq: maxSerial } },
      { upsert: true },
    );
  console.log(`[MongoDB Counter]: Synced to ${maxSerial}`);
};

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn(
      "[MongoDB Warning]: MONGODB_URI not found in .env! Operating on local database.",
    );
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`=================================================`);
    console.log(` MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(` Database Name: ${conn.connection.name}`);
    console.log(`=================================================`);
    await syncRegistrationCounter();
    return true;
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.warn("[MongoDB Fallback]: Operating on local database.");
    return false;
  }
};

module.exports = connectDB;
