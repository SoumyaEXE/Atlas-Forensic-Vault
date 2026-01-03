import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri: string = process.env.MONGODB_URI;
const dbName: string = process.env.DB_NAME || 'repo_to_podcast';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// Add connection options for Edge environment
const options = {
  // These options are required for MongoDB driver to work in Cloudflare Workers
  // when using the nodejs_compat flag
  driverInfo: { name: 'next-js-edge' }
};

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(uri, options);
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getCollection(collectionName: string) {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}
