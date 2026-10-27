// Environment configuration and validation for FastRev.
import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGO_URI', 'JWT_SECRET', 'FRONTEND_ORIGIN'];

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  groqApiKey: process.env.GROQ_API_KEY || '',
  cerebrasApiKey: process.env.CEREBRAS_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};

export function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.warn(`[env] Missing required environment variables: ${missing.join(', ')}`);
    if (env.nodeEnv === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  return { missing };
}

export default env;