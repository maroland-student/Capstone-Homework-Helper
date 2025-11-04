import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Check for required environment variables
const requiredEnvVars = ['DB_USERNAME', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DATABASE_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file and ensure all database variables are set.');
  process.exit(1);
}

const connectionString = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DATABASE_NAME}?sslmode=require`;


const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require'
});

const db = drizzle(client);

export { db };

