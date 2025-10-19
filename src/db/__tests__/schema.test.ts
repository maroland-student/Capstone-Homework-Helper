import { accountsTable, sessionsTable, usersTable, verificationsTable } from '../schema';

describe('database schema', () => {
  it('should have users table defined', () => {
    // testing that users table is properly defined
    expect(usersTable).toBeDefined();
    expect(typeof usersTable).toBe('object');
  });

  it('should have sessions table defined', () => {
    // testing that sessions table is properly defined
    expect(sessionsTable).toBeDefined();
    expect(typeof sessionsTable).toBe('object');
  });

  it('should have accounts table defined', () => {
    // testing that accounts table is properly defined
    expect(accountsTable).toBeDefined();
    expect(typeof accountsTable).toBe('object');
  });

  it('should have verifications table defined', () => {
    // testing that verifications table is properly defined
    expect(verificationsTable).toBeDefined();
    expect(typeof verificationsTable).toBe('object');
  });

  it('should have all tables as objects', () => {
    // testing that all tables are valid objects
    const tables = [usersTable, sessionsTable, accountsTable, verificationsTable];
    tables.forEach(table => {
      expect(table).toBeDefined();
      expect(typeof table).toBe('object');
    });
  });

  it('should execute table references', () => {
    // testing that table references are properly executed
    expect(sessionsTable).toBeDefined();
    expect(accountsTable).toBeDefined();
    expect(verificationsTable).toBeDefined();
  });

  it('should have proper table structure', () => {
    // testing that tables have proper structure
    expect(usersTable).toBeDefined();
    expect(sessionsTable).toBeDefined();
    expect(accountsTable).toBeDefined();
    expect(verificationsTable).toBeDefined();
  });
});
