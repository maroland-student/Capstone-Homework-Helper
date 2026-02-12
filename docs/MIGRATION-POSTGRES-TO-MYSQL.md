# Migration: PostgreSQL (Drizzle) to MySQL

This document describes how to migrate the current database setup from PostgreSQL with Drizzle ORM to MySQL. The application uses Drizzle for the schema and migrations, and better-auth with the Drizzle adapter for authentication.

---

## Current Setup Summary

- **ORM:** Drizzle ORM
- **Driver:** `postgres` (postgres.js)
- **Dialect:** PostgreSQL
- **Config:** `drizzle.config.ts` (dialect `postgresql`, credentials from env)
- **Schema:** `src/db/schema.ts` (PostgreSQL-specific: `pgEnum`, `pgTable`, `pg-core` types)
- **DB client:** `src/db/index.ts` (connection string from `DB_USERNAME`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DATABASE_NAME`, SSL)
- **Auth:** `lib/auth.ts` uses `better-auth` with `drizzleAdapter(db, { provider: "pg", schema })`
- **Tables:** `user`, `session`, `account`, `verification`; enum `role` (`'teacher' | 'student'`)

---

## Overview of the Migration

1. Change Drizzle to use the MySQL dialect and MySQL driver.
2. Rewrite the schema to use MySQL-specific column and table APIs.
3. Update the database client and connection string.
4. Confirm better-auth compatibility with MySQL and adjust adapter if needed.
5. Create new migrations for MySQL (do not reuse existing PostgreSQL migration files).
6. Migrate existing data from PostgreSQL to MySQL (optional, for existing environments).

---

## Step 1: Dependencies

Remove the PostgreSQL driver and add the MySQL driver:

```bash
npm uninstall postgres
npm install mysql2
```

Keep `drizzle-orm` and `drizzle-kit`; they support both PostgreSQL and MySQL.

---

## Step 2: Schema (`src/db/schema.ts`)

PostgreSQL and MySQL use different Drizzle modules. Replace `pg-core` with `mysql-core` and map types accordingly.

**Current (PostgreSQL):**

- `pgEnum`, `pgTable`, `text`, `timestamp`, `varchar`, `boolean` from `drizzle-orm/pg-core`.

**Target (MySQL):**

- Use `mysqlTable`, `mysqlEnum` (or a `varchar` with a check), and equivalent column types from `drizzle-orm/mysql-core` (e.g. `varchar`, `text`, `boolean`, `timestamp`, `datetime`).

Example mapping:

| PostgreSQL (current)       | MySQL (target)                                               |
| -------------------------- | ------------------------------------------------------------ |
| `pgEnum("role", [...])`    | `mysqlEnum("role", ["teacher", "student"])` or `varchar`     |
| `pgTable("user", {...})`   | `mysqlTable("user", {...})`                                  |
| `text("id")`               | `varchar("id", { length: 255 })` or keep `text` if supported |
| `timestamp("createdAt")`   | `timestamp("createdAt")` or `datetime("createdAt")`          |
| `varchar({ length: 255 })` | `varchar("columnName", { length: 255 })`                     |
| `boolean()`                | `boolean("columnName")`                                      |

Rewrite `src/db/schema.ts` to import from `drizzle-orm/mysql-core` and define:

- The same four tables: `user`, `session`, `account`, `verification`.
- The same columns and constraints (primary keys, unique, not null, defaults).
- The same foreign keys and `onDelete: "cascade"` where applicable.
- The `role` enum (or equivalent) on `user`.

Ensure the table and column names match what better-auth expects (e.g. `user`, `session`, `account`, `verification` and the field names used in the current schema).

---

## Step 3: Database Client (`src/db/index.ts`)

Replace the Postgres client with a MySQL client.

**Current:** `drizzle-orm/postgres-js` and `postgres(connectionString, options)`.

**Target:** Use the MySQL driver with Drizzle’s MySQL integration, for example:

- `drizzle-orm/mysql2` with `mysql2.createPool()` or `mysql2.createConnection()`, or
- The equivalent API shown in the Drizzle docs for MySQL.

Connection string format for MySQL:

```
mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

Update the required env vars if you change names (e.g. keep `DB_USERNAME`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DATABASE_NAME` and build the MySQL URL from them, or switch to a single `DATABASE_URL`). Remove PostgreSQL-specific options (e.g. `sslmode=require`); use MySQL’s SSL options if you need TLS.

---

## Step 4: Drizzle Config (`drizzle.config.ts`)

- Set `dialect` to `'mysql'` (or the value required by your `drizzle-kit` version).
- Set `dbCredentials` to a MySQL URL (same format as in Step 3).
- Remove PostgreSQL-only options (e.g. `ssl: { rejectUnauthorized: false }`); configure MySQL SSL in the URL or driver options if needed.

Schema path can stay `./src/db/schema.ts`; the schema file itself is already being changed to MySQL in Step 2.

---

## Step 5: Migrations (Do Not Reuse PostgreSQL Migrations)

The existing migrations under `drizzle/` are for PostgreSQL (e.g. `CREATE TYPE "role" AS ENUM(...)`, PostgreSQL `CREATE TABLE` syntax). They must not be run against MySQL.

1. Generate a new migration for MySQL:
   - After Steps 1–4, run: `npm run db:generate` (or `drizzle-kit generate`).
   - This will create new SQL in `drizzle/` that is valid for MySQL (e.g. `ENUM` or equivalent, MySQL `CREATE TABLE`).
2. Optionally move or archive the old PostgreSQL migration files so they are not applied to MySQL (e.g. rename folder or delete contents of `drizzle/` before generating, depending on your workflow).
3. Apply the new migration to your MySQL database with `npm run db:migrate` (or your chosen migrate command), or use `db:push` if you use push-based workflow.

---

## Step 6: better-auth Adapter (`lib/auth.ts`)

The app uses `drizzleAdapter(db, { provider: "pg", schema })`. For MySQL:

1. Check the better-auth documentation for the correct `provider` value for MySQL (e.g. `"mysql"` or similar) and that the Drizzle adapter supports MySQL.
2. If supported, change `provider` from `"pg"` to the MySQL provider and keep the same `schema` (same table and column names).
3. If the adapter does not support MySQL, you may need to use a different better-auth database adapter or a different auth strategy; the rest of the migration (Drizzle + MySQL) still applies to your own tables.

---

## Step 7: Environment Variables

Adjust `.env` and any deployment config so that:

- The connection URL and credentials point to the MySQL instance (host, port, user, password, database name).
- Any SSL or TLS settings use MySQL’s conventions (e.g. in the URL or driver options), not PostgreSQL’s `sslmode`.

If you keep the same variable names (`DB_USERNAME`, `DB_PASSWORD`, etc.), only the code that builds the URL and creates the client needs to change (Steps 3 and 4).

---

## Step 8: Data Migration (Existing Production/Staging Data)

If you need to move existing data from PostgreSQL to MySQL:

1. **Export from PostgreSQL**
   - Use `pg_dump` (or a script using the current Drizzle/Postgres client) to export the tables `user`, `session`, `account`, `verification` (and any other tables you add).
   - Prefer data-only or table+data dump in a format you can transform (e.g. CSV, or SQL that you can adapt).

2. **Transform (if needed)**
   - PostgreSQL `timestamp` and MySQL `DATETIME`/`TIMESTAMP` are compatible in many cases; ensure timezone handling matches your app.
   - The `role` enum in PostgreSQL is a distinct type; in MySQL it may be an `ENUM` or `VARCHAR`. Ensure exported values are exactly `'teacher'` or `'student'` and that the MySQL column accepts them.
   - Check that text encoding (e.g. UTF-8) is consistent so no data is corrupted.

3. **Import into MySQL**
   - Create the schema in MySQL first (via the new Drizzle migration from Step 5).
   - Load data with `mysql` CLI, a script, or an ETL step. Respect foreign key order (e.g. `user` before `session` and `account`, then `verification`).
   - Re-enable foreign key checks after import if you disabled them for the load.

4. **Verification**
   - Run queries or a small script to compare row counts and spot-check critical columns between PostgreSQL and MySQL.

---

## Step 9: Application Entrypoints

Search the codebase for any other use of the Postgres client or PostgreSQL-specific APIs:

- The repo currently has `src/index.ts` importing `drizzle-orm/node-postgres` and `process.env.DATABASE_URL`. Update that file to use the same MySQL client and connection as `src/db/index.ts`, or to import the shared `db` from `src/db` so there is a single place that creates the Drizzle instance.

---

## Checklist

- [ ] Swap `postgres` for `mysql2` in dependencies; update `src/db/index.ts` to use MySQL connection and Drizzle’s MySQL driver.
- [ ] Rewrite `src/db/schema.ts` to use `drizzle-orm/mysql-core` (mysqlTable, mysqlEnum/varchar, correct column types).
- [ ] Update `drizzle.config.ts` to `dialect: 'mysql'` and a MySQL connection URL.
- [ ] Generate new migrations with `db:generate`; do not reuse old PostgreSQL migration SQL.
- [ ] Apply new migrations (or `db:push`) to the MySQL database.
- [ ] Set better-auth adapter to the MySQL provider and confirm compatibility.
- [ ] Update env and deployment config for MySQL (URL, SSL, etc.).
- [ ] If migrating data, export from PostgreSQL, transform if needed, import into MySQL, and verify.
- [ ] Update any other files that instantiate Drizzle or use the DB (e.g. `src/index.ts`).
- [ ] Run the app and auth flows against MySQL and run tests.

---

## References

- Drizzle ORM: MySQL documentation (schema, migrations, and driver usage).
- drizzle-kit: Supported dialects and `dialect` / `dbCredentials` for MySQL.
- better-auth: Database adapters and supported databases (e.g. MySQL with Drizzle).
- MySQL: Connection strings, SSL, and data types for compatibility with your schema.
