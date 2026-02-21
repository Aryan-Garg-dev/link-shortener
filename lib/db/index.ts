import { Db, MongoClient } from "mongodb";
import env from "@/lib/env";

const uri = env.MONGO_URI;
if (!uri) throw new Error("MongoDB URI not found");

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
  var mongoDbInstance: Db | undefined;
  var mongoIndexesInitialized: boolean | undefined;
}

export async function getDB(): Promise<Db> {
  if (!global.mongoClientPromise) global.mongoClientPromise = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000
  }).connect()
    .catch(err => {
      global.mongoClientPromise = undefined;
      throw err;
  });

  const client = await global.mongoClientPromise;


  if (!global.mongoDbInstance) global.mongoDbInstance = client.db("link-shortener");

  const db = global.mongoDbInstance;

  if (!global.mongoIndexesInitialized) {
    global.mongoIndexesInitialized = true;

    const linksCollection = db.collection("links");

    void linksCollection.createIndexes([
      { key: { code: 1 }, name: "unique_code", unique: true },
      { key: { url: 1 }, name: "unique_url", unique: true }
    ]).catch((err) => {
      console.error("Index creation failed:", err);
      global.mongoIndexesInitialized = false;
    })
  }

  return db;
}