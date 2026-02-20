import { MongoClient } from "mongodb";
import env from "@/lib/env";

const uri = env.MONGO_URI;
if (!uri) throw new Error("MongoDB URI not found");

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
  var mongoIndexesInitialized: boolean | undefined;
}

if (!global.mongoClientPromise) {
  global.mongoClientPromise = new MongoClient(uri).connect();
}

const client = await global.mongoClientPromise;
export const db = client.db("link-shortener");

if (!global.mongoIndexesInitialized) {
  global.mongoIndexesInitialized = true;

  const linksCollection = db.collection("links");

  await linksCollection.createIndexes([
    { key: { code: 1 }, name: "unique_code", unique: true },
    { key: { url: 1 }, name: "unique_url", unique: true }
  ]);
}