import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { usersTable } from './db/schema';

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log('Testing database connection...');
    
    const users = await db.select().from(usersTable).limit(1);
    console.log('Database connection successful!');
    console.log('Current users in database:', users.length);
  } catch (error) {
    console.error('Database connection failed:', error);
    console.log('\nMake sure:');
    console.log('1. PostgreSQL is running');
    console.log('3. Database exists');
  }
}

main();
