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
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  cerebrasApiKey: process.env.CEREBRAS_API_KEY || '',
  cerebrasModel: process.env.CEREBRAS_MODEL || 'llama3.1-8b',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  aiProviderTimeoutMs: Number(process.env.AI_PROVIDER_TIMEOUT_MS) || 15000,
  aiProviderMaxRetries: Number(process.env.AI_PROVIDER_MAX_RETRIES) || 1,
  aiCooldownMs: Number(process.env.AI_COOLDOWN_MS) || 60000,
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