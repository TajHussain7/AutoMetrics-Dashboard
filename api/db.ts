import "dotenv/config"; // Load env vars first
import { MongoClient, Db } from "mongodb";
import mongoose from "mongoose";
import { info, error as errorLogger } from "./utils/logger.js";

let db: Db;

// Connection pool configuration
const connectionOptions = {
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 2, // Minimum number of connections to maintain
  maxIdleTimeMS: 30000, // Close connections idle for 30 seconds
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
};

export async function connectDB() {
  try {
    // Connect using mongoose for models with connection pooling
    await mongoose.connect(process.env.MONGO_URI!, connectionOptions);
    info(
      "✅ Connected to MongoDB Atlas with Mongoose (Pool: 2-10 connections)"
    );

    // Also connect using MongoClient for direct collection access
    const client = new MongoClient(process.env.MONGO_URI!, connectionOptions);
    await client.connect();
    db = client.db(); // Get the default database
    info(
      "✅ Connected to MongoDB Atlas with MongoClient (Pool: 2-10 connections)"
    );
  } catch (err) {
    errorLogger("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

export { db };
