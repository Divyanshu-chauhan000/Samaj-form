const mongoose = require('mongoose');

const oldUri = "mongodb+srv://samaj_admin:kfKm9YhDo2OIkRBX@cluster0.jkmossm.mongodb.net/samaj_directory?retryWrites=true&w=majority&appName=Cluster0";
const newUri = "mongodb+srv://kumawatsamaj371_db_user:2qnyhSXrKVSBgHRl@kumawat-samaj.vw6fzrp.mongodb.net/?appName=kumawat-samaj";

async function migrate() {
  try {
    console.log("Connecting to old database...");
    const oldConnection = await mongoose.createConnection(oldUri).asPromise();
    const collections = await oldConnection.db.listCollections().toArray();

    console.log("Connecting to new database...");
    const newConnection = await mongoose.createConnection(newUri).asPromise();

    for (let colInfo of collections) {
      if (colInfo.type === 'view') continue;
      const colName = colInfo.name;
      console.log(`Migrating ${colName}...`);
      
      const docs = await oldConnection.collection(colName).find({}).toArray();
      if (docs.length > 0) {
        await newConnection.collection(colName).insertMany(docs, { ordered: false }).catch((e) => {
          console.log(`Note: Some duplicates were skipped in ${colName}`);
        });
        console.log(`Inserted ${docs.length} into ${colName}`);
      }
    }
    console.log("Migration Complete! Saara data copy ho gaya.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}
migrate();
