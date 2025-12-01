import "dotenv/config"; // Load env vars first
import { MongoClient, Db } from "mongodb";
import mongoose from "mongoose";

let db: Db;

export async function connectDB() {
  try {
    // Connect using mongoose for models
    await mongoose.connect(process.env.MONGO_URI!);
    console.info("✅ Connected to MongoDB Atlas with Mongoose");

    // Also connect using MongoClient for direct collection access
    const client = new MongoClient(process.env.MONGO_URI!);
    await client.connect();
    db = client.db(); // Get the default database
    console.info("✅ Connected to MongoDB Atlas with MongoClient");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

export { db };
