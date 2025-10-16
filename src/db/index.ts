import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DATABASE_NAME}?sslmode=require`;

const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require'
});

const db = drizzle(client);

export { db };

