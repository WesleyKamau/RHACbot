/**
 * Application configuration
 * Loads from environment variables with safe defaults
 */

import { MongoClient, Db } from 'mongodb';

export class Config {
  static GROUPME_ACCESS_TOKEN = process.env.GROUPME_ACCESS_TOKEN || '';
  static SECRET_KEY = process.env.SECRET_KEY || '';
  static ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
  static MONGODB_URI = process.env.MONGODB_URI || '';
  static ENV = process.env.ENV || process.env.NODE_ENV || 'development';
  
  // MongoDB database names per environment
  static MONGODB_DB = process.env.MONGODB_DB || '';
  static MONGODB_DB_DEV = process.env.MONGODB_DB_DEV || '';
  static MONGODB_DB_PROD = process.env.MONGODB_DB_PROD || '';

  /**
   * Get the database name appropriate for the current ENV
   */
  static getMongoDBName(): string {
    const env = (this.ENV || 'development').toLowerCase();
    if (env === 'dev' || env === 'development') {
      if (this.MONGODB_DB_DEV) return this.MONGODB_DB_DEV;
    }
    if (env === 'prod' || env === 'production') {
      if (this.MONGODB_DB_PROD) return this.MONGODB_DB_PROD;
    }
    if (this.MONGODB_DB) return this.MONGODB_DB;
    return 'rhac_db';
  }

  /**
   * Validate required environment variables
   */
  static validate(): string[] {
    const missing: string[] = [];
    const required = ['GROUPME_ACCESS_TOKEN', 'MONGODB_URI'];
    
    for (const varName of required) {
      if (!(this as any)[varName]) {
        missing.push(varName);
      }
    }
    
    if (missing.length > 0) {
      console.warn(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    return missing;
  }
}

// MongoDB connection singleton
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!Config.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  const client = new MongoClient(Config.MONGODB_URI);
  await client.connect();
  
  const dbName = Config.getMongoDBName();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  console.log(`Connected to MongoDB: ${dbName} (env=${Config.ENV})`);

  return { client, db };
}
