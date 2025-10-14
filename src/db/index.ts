import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Create connection string from your RDS instance with SSL
const connectionString = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DATABASE_NAME}?sslmode=require`;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require'
});
const db = drizzle(client);

export { db };

