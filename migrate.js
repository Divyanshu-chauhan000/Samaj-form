const mongoose = require('mongoose');

const oldUri = "mongodb+srv://samaj_admin:kfKm9YhDo2OIkRBX@cluster0.jkmossm.mongodb.net/samaj_directory?retryWrites=true&w=majority&appName=Cluster0";
const newUri = "mongodb+srv://kumawatsamaj371_db_user:2qnyhSXrKVSBgHRl@kumawat-samaj.vw6fzrp.mongodb.net/?appName=kumawat-samaj";

async function migrate() {
  try {
    console.log("Connecting to old database...");
    const oldConnection = await mongoose.createConnection(oldUri).asPromise();
    
    // Fetch all collections in the old database
    const collections = await oldConnection.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`, collections.map(c => c.name));

    console.log("Connecting to new database...");
    const newConnection = await mongoose.createConnection(newUri).asPromise();

    for (let colInfo of collections) {
      if (colInfo.type === 'view') continue; // Skip views
      
      const colName = colInfo.name;
      console.log(`\nMigrating collection: ${colName}`);
      
      const oldCol = oldConnection.collection(colName);
      const newCol = newConnection.collection(colName);

      const docs = await oldCol.find({}).toArray();
      console.log(`Found ${docs.length} documents in ${colName}`);
      
      if (docs.length > 0) {
        try {
          await newCol.insertMany(docs, { ordered: false });
          console.log(`Successfully inserted ${docs.length} documents into new ${colName}`);
        } catch (insertError) {
          console.log(`Some errors occurred during insert (possibly duplicates): ${insertError.message}`);
        }
      }
    }
    
    console.log("\nMigration completed successfully.");
    await oldConnection.close();
    await newConnection.close();
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
