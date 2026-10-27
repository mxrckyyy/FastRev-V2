// MongoDB connection management using Mongoose.
import mongoose from 'mongoose';
import env from './env.js';

let connected = false;

export async function connectDb() {
  if (connected) return mongoose.connection;
  if (!env.mongoUri) {
    throw new Error('MONGO_URI is not configured');
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