// MongoDB connection management using Mongoose.
import mongoose from 'mongoose';
import env from './env.js';

let connected = false;

export async function connectDb() {
  // Reuse an already-live connection (important for serverless reuse).
  if (connected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!env.mongoUri) {
    throw new Error('MONGO_URI is not configured');
  }
  if (mongoose.connection.readyState !== 0) {
    // Clean up a stale/disconnected handle before reconnecting.
    await mongoose.disconnect().catch(() => {});
  }
  await mongoose.connect(env.mongoUri);
  connected = true;
  return mongoose.connection;
}

export async function disconnectDb() {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export default { connectDb, disconnectDb, isDbConnected };