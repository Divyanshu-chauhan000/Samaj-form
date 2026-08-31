const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn("[MongoDB Warning]: MONGODB_URI not found in .env! Operating on local database.");
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`=================================================`);
    console.log(` MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(` Database Name: ${conn.connection.name}`);
    console.log(`=================================================`);
    return true;
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.warn("[MongoDB Fallback]: Operating on local database.");
    return false;
  }
};

module.exports = connectDB;
