import { MongoClient, ObjectId } from "mongodb";

// Prefer the same variable names the auth server uses so both hit the same DB 
export const DB_NAME =
process.env.MONGO_DB || process.env.DB_NAME || "traveltracker_p3";
export const URI = 
process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017";

export function connect() {
  const client = new MongoClient(URI);
  const db = client.db(DB_NAME);
  return { client, db };
}

export function toObjectId(id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && id.length === 24) return new ObjectId(id);
  if (typeof id === "object" && id.$oid) return new ObjectId(id.$oid);
  throw new Error(`Invalid ObjectId: ${JSON.stringify(id)}`);
}
