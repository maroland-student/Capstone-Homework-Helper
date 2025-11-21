import 'dotenv/config';
import { db } from '../src/db';
import { usersTable } from '../src/db/schema';

async function checkUsers() {
  try {
    console.log('Connecting to database...');
    const users = await db.select().from(usersTable);
    
    console.log(`\nFound ${users.length} user(s) in database:\n`);
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name || 'N/A'}`);
      console.log(`  Role: ${user.role || 'UNDEFINED'}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error querying database:', error);
    process.exit(1);
  }
}

checkUsers();

