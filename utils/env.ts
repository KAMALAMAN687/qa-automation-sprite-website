import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const ENV = {
  BASE_URL: process.env.BASE_URL || 'https://sprite-joke-in-a-bottle.coke2home.com',
  API_URL: process.env.API_URL || 'https://sprite-joke-in-a-bottle.coke2home.com/api',

  TEST_USER_EMAIL: process.env.TEST_USER_EMAIL || '',
  TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD || '',

  TEST_ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL || '',
  TEST_ADMIN_PASSWORD: process.env.TEST_ADMIN_PASSWORD || '',

  // OTP-based auth
  TEST_PHONE_NUMBER: process.env.TEST_PHONE_NUMBER || '',
  TEST_OTP: process.env.TEST_OTP || '',

  API_AUTH_TOKEN: process.env.API_AUTH_TOKEN || '',
};
