import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGO_DB || "traveltracker";

let client;
let db;

export async function getDb() {
  if (db) return db;
  client = new MongoClient(uri, { ignoreUndefined: true });
  await client.connect();
  db = client.db(dbName);
  // Ensure unique index on email
  const users = db.collection(process.env.MONGO_USERS_COLLECTION || "users");
  await users.createIndex({ email: 1 }, { unique: true });
  return db;
}

export async function closeDb() {
  if (client) await client.close();
}
