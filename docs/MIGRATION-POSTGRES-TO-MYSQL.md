# Migration: PostgreSQL (Drizzle) to MySQL and Django

This document describes migration to the target stack: **React.js** (frontend), **Python Django** (backend), **MySQL** (database). The current setup uses PostgreSQL with Drizzle ORM and better-auth; Expo (React Native) is being replaced by a React.js frontend. The backend moves from Node/Express to Django; the database moves from PostgreSQL to MySQL. Drizzle is part of the current stack and is superseded by Django ORM once the backend is fully Django.

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

Update the required env vars if names change (e.g. keep `DB_USERNAME`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DATABASE_NAME` and build the MySQL URL from them, or switch to a single `DATABASE_URL`). Remove PostgreSQL-specific options (e.g. `sslmode=require`); use MySQL’s SSL options if TLS is required.

---

## Step 4: Drizzle Config (`drizzle.config.ts`)

- Set `dialect` to `'mysql'` (or the value required by the project’s `drizzle-kit` version).
- Set `dbCredentials` to a MySQL URL (same format as in Step 3).
- Remove PostgreSQL-only options (e.g. `ssl: { rejectUnauthorized: false }`); configure MySQL SSL in the URL or driver options if needed.

Schema path can stay `./src/db/schema.ts`; the schema file itself is already being changed to MySQL in Step 2.

---

## Step 5: Migrations (Do Not Reuse PostgreSQL Migrations)

The existing migrations under `drizzle/` are for PostgreSQL (e.g. `CREATE TYPE "role" AS ENUM(...)`, PostgreSQL `CREATE TABLE` syntax). They must not be run against MySQL.

1. Generate a new migration for MySQL:
   - After Steps 1–4, run: `npm run db:generate` (or `drizzle-kit generate`).
   - This will create new SQL in `drizzle/` that is valid for MySQL (e.g. `ENUM` or equivalent, MySQL `CREATE TABLE`).
2. Optionally move or archive the old PostgreSQL migration files so they are not applied to MySQL (e.g. rename folder or delete contents of `drizzle/` before generating, depending on the workflow).
3. Apply the new migration to the MySQL database with `npm run db:migrate` (or the chosen migrate command), or use `db:push` for a push-based workflow.

---

## Step 6: better-auth Adapter (`lib/auth.ts`)

The App uses `drizzleAdapter(db, { provider: "pg", schema })`. For MySQL:

1. Check the better-auth documentation for the correct `provider` value for MySQL (e.g. `"mysql"` or similar) and that the Drizzle adapter supports MySQL.
2. If supported, change `provider` from `"pg"` to the MySQL provider and keep the same `schema` (same table and column names).
3. If the adapter does not support MySQL, a different better-auth database adapter or auth strategy may be needed; the rest of the migration (Drizzle + MySQL) still applies to The App’s tables.

---

## Step 7: Environment Variables

Adjust `.env` and any deployment config so that:

- The connection URL and credentials point to the MySQL instance (host, port, user, password, database name).
- Any SSL or TLS settings use MySQL’s conventions (e.g. in the URL or driver options), not PostgreSQL’s `sslmode`.

If the same variable names are kept (`DB_USERNAME`, `DB_PASSWORD`, etc.), only the code that builds the URL and creates the client needs to change (Steps 3 and 4).

---

## Step 8: Data Migration (Existing Production/Staging Data)

When moving existing data from PostgreSQL to MySQL:

1. **Export from PostgreSQL**
   - Use `pg_dump` (or a script using the current Drizzle/Postgres client) to export the tables `user`, `session`, `account`, `verification` (and any other tables added).
   - Prefer data-only or table+data dump in a format that can be transformed (e.g. CSV, or SQL that can be adapted).

2. **Transform (if needed)**
   - PostgreSQL `timestamp` and MySQL `DATETIME`/`TIMESTAMP` are compatible in many cases; ensure timezone handling matches The App.
   - The `role` enum in PostgreSQL is a distinct type; in MySQL it may be an `ENUM` or `VARCHAR`. Ensure exported values are exactly `'teacher'` or `'student'` and that the MySQL column accepts them.
   - Check that text encoding (e.g. UTF-8) is consistent so no data is corrupted.

3. **Import into MySQL**
   - Create the schema in MySQL first (via the new Drizzle migration from Step 5).
   - Load data with `mysql` CLI, a script, or an ETL step. Respect foreign key order (e.g. `user` before `session` and `account`, then `verification`).
   - Re-enable foreign key checks after import if they were disabled for the load.

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

---

## Backend Migration: Node/Express to Python Django

The migration plan moves the backend from Node/Express to **Python Django** and uses **MySQL** as the database. The frontend moves from Expo (React Native) to **React.js**. Django will own the API, the database (via Django ORM and migrations), and authentication. This section covers Django in that context and how to replace better-auth with Django’s auth system.

### Django Overview

- **Framework:** Django is a Python web framework (MVC-style: models, views, templates). It provides an ORM, migrations, admin, and built-in auth.
- **Database:** Django supports PostgreSQL, MySQL, SQLite, Oracle. For MySQL, `DATABASES` is configured in `settings.py` with an engine such as `django.db.backends.mysql` and the `mysqlclient` or `PyMySQL` driver.
- **API layer:** The App is API-driven (the React.js frontend will call HTTP endpoints). In Django, APIs are exposed via:
  - **Django REST framework (DRF):** Common choice for REST APIs (serializers, viewsets, auth, throttling).
  - **Plain Django views** returning JSON (e.g. `JsonResponse`).
- **Auth:** Django has a built-in auth system: `User` model (username, email, password, etc.), `Session` and session middleware, password hashing, and helpers like `login()`, `logout()`, `authenticate()`. For token or session-based APIs, DRF’s session auth, token auth, or JWT (e.g. `djangorestframework-simplejwt`) can be used.
- **Migrations:** Models are defined in Python; `python manage.py makemigrations` and `migrate` create/update the MySQL schema. Drizzle is not used on the backend once the move to Django is complete.

### Current better-auth Usage (from codebase)

The App uses better-auth in these ways:

| Feature | Where used | Details |
|--------|------------|--------|
| Email + password sign-in | `LoginForm`, `auth-client` | `signIn.email({ email, password, rememberMe })` |
| Email + password sign-up | `SignupForm` | `signUp.email({ email, password, name, role })`; role is `"teacher"` or `"student"` |
| Sign out | `auth-context`, `settings`, `AuthTest` | `signOut()`; clears session and local state |
| Session / user state | `auth-context`, `_layout`, `welcome-dashboard` | `getSession()`, `useSession()`; `user` and `loading` drive routing and UI |
| Email OTP – send code | `OTPLoginForm`, `EmailOTPForm`, `LoginForm` (forgot password) | `emailOtp.sendVerificationOtp({ email, type })`; types: `sign-in`, `email-verification`, `forget-password` |
| Email OTP – sign-in | `OTPLoginForm`, `EmailOTPForm` | `signIn.emailOtp({ email, otp })` |
| Email OTP – verify email | `EmailOTPForm` | `emailOtp.verifyEmail({ email, otp })` |
| Email OTP – forgot password | `LoginForm`, `PasswordResetForm` | Send OTP with `type: 'forget-password'`; then `emailOtp.checkVerificationOtp` and `emailOtp.resetPassword({ email, otp, password })` |
| User custom field | Schema, sign-up | `role` (`"teacher"` \| `"student"`) stored on user; used in Assignments tab (teacher vs student UI) and can be used for welcome text |
| Token / session storage | `auth-client` | Current codebase uses `@better-auth/expo` with SecureStore (Expo). The React.js frontend will use cookies or browser storage for the session/token returned by Django. |
| Auth API surface | `server/routes/api/auth.ts` | All `/api/auth/*` requests forwarded to `auth.handler()` |
| Email sending | `lib/auth.ts`, `lib/email-service.ts` | better-auth `emailOTP` plugin calls `sendOTPEmail()` (nodemailer SMTP) for OTP emails |

The Assignments tab uses a local `role` state (Teacher/Student toggle) that is currently independent of the logged-in user’s stored `role`; the stored `role` is available on `session.user.role` and could be used to set or restrict that UI later.

### Replacing better-auth with Django auth – feature mapping

| better-auth feature | Django / DRF equivalent | Notes |
|---------------------|---------------------------|--------|
| Email + password login | `django.contrib.auth.authenticate()` with a custom backend that uses `email` (or `User` with `USERNAME_FIELD = 'email'`), then `login(request, user)`; or DRF `SessionAuthentication` / custom login view that returns session cookie or token | Straightforward. Use a custom user model with `email` as the main identifier if username is not required. |
| Email + password sign-up | Custom view or DRF serializer that creates `User` (and optional profile with role); hash password with `make_password`, save user | Role can be a field on a related profile model or an extended User model. |
| Sign out | `logout(request)`; API: clear session or invalidate token and return 204 | The React.js client must stop sending the session cookie or token. |
| Session / get session | Django sessions (database or cookie); API: view that returns current user (and role) if authenticated, 401 otherwise | The React.js client will call something like `GET /api/auth/session` and get `{ user: { id, email, name, role } }` or similar. |
| User with role | Custom User model or OneToOne profile with `role` (CharField with choices or TextChoices: teacher/student) | Migrate existing `user` table shape into Django model; keep `role` in sync. |
| Password reset via email link | `django.contrib.auth.views.PasswordResetView` and related views; or custom flow with `PasswordResetTokenGenerator` and email | Django’s default is “link in email” not “OTP in email”. |
| Email OTP (send 6-digit code) | Custom: store OTP in DB or cache (e.g. Redis/Django cache) with email and expiry; send email via Django `send_mail` or a task queue | No built-in OTP; The App reimplements send, store, and expiry. |
| Email OTP sign-in | Custom: view that checks OTP for email, creates or retrieves user, then `login()` or returns token | Replaces `signIn.emailOtp` with a single Django endpoint that validates OTP and establishes session/token. |
| Email OTP forgot-password | Custom: same OTP storage; “forget-password” type sets a flag or separate key; after verify OTP, accept new password and update user | Replaces better-auth’s `emailOtp.checkVerificationOtp` + `emailOtp.resetPassword`. |
| Email OTP verify email | Custom: mark `emailVerified` (or equivalent) true after OTP check | Optional if The App does not require verified email for login. |
| Session/token storage (React.js) | Client-only: the React.js app will store the session cookie or token (e.g. cookie, localStorage, or sessionStorage) that Django returns. | No Expo or SecureStore; use standard web storage or cookies for the Django session/token. |
| CORS / trusted origins | Django `CORS_ALLOWED_ORIGINS` or `CSRF_TRUSTED_ORIGINS` for the React.js origin and API base URL. | Match the intended `trustedOrigins` and `baseURL` for The App. |

### Features that would be lost or require reimplementation

- **Unified “email OTP for everything” flow:** better-auth’s plugin gives one flow for sign-in, email verification, and forgot-password (same `sendVerificationOtp` + type). Django does not; The App must implement:
  - OTP generation, storage (DB or cache), and expiry (e.g. 5 minutes).
  - Sending OTP emails (Django email backend or Celery task).
  - Endpoints: send OTP, verify OTP and sign-in, verify OTP and set new password (and optionally “verify email”).
  - Rate limiting and attempt limits (e.g. 3 attempts) in Django views.
- **Expo / React Native:** Expo is going away. The frontend becomes a React.js app that talks to the Django API. There is no `@better-auth/expo` or SecureStore; the React.js app uses cookies or browser storage for the session/token returned by Django.
- **Single auth handler:** Today one `auth.handler()` serves all better-auth routes. With Django, separate URLs and views (or DRF viewsets) are defined for login, signup, logout, session, send-OTP, verify-OTP, reset-password, etc., and can be mounted under something like `/api/auth/` to keep a similar structure.
- **Password reset style:** If The App standardizes on Django’s default “link in email” reset, the current “OTP then new password” flow would be replaced unless the OTP-based reset is reimplemented in Django.
- **Schema parity:** better-auth’s `user`, `session`, `account`, `verification` tables are specific to its design. Django uses `auth_user`, `django_session`, and optional tables. Data is either migrated into Django’s schema (with accepted differences) or custom models that mirror the old schema are defined in Django (more work, less Django-native).

### Recommended approach for Django auth

1. **Custom User model** (if not already at project start): Use `AbstractUser` or `AbstractBaseUser` with `EMAIL_FIELD` and a `role` field (or a OneToOne “profile” with `role`) so The App keeps teacher/student.
2. **Session-based API auth:** Use Django sessions and DRF `SessionAuthentication` so the React.js frontend sends the session cookie to the Django API; or use token auth (DRF token or JWT) and store the token in the React.js app (e.g. memory or secure cookie).
3. **OTP flows:** Add Django apps or modules for “otp” and “accounts”: models (or cache keys) for pending OTPs (email, type, expires_at, attempts), views for send-OTP and verify-OTP (sign-in vs reset-password), and wire email sending (same SMTP config conceptually as the current `email-service`).
4. **URL layout:** e.g. `/api/auth/login/`, `/api/auth/signup/`, `/api/auth/logout/`, `/api/auth/session/`, `/api/auth/otp/send/`, `/api/auth/otp/verify/`, `/api/auth/password/reset/` so the React.js client can be updated from better-auth endpoints to these.
5. **Client changes:** In the React.js app, replace every better-auth client call with fetch (or a small API client) to the new Django endpoints; keep a `useAuth`-style context but feed it from the Django session or token endpoint.

---

## References

- Drizzle ORM: MySQL documentation (schema, migrations, and driver usage).
- drizzle-kit: Supported dialects and `dialect` / `dbCredentials` for MySQL.
- better-auth: Database adapters and supported databases (e.g. MySQL with Drizzle).
- MySQL: Connection strings, SSL, and data types for compatibility with the schema.
- Django: Official documentation (models, migrations, auth, settings).
- Django REST framework: Authentication, serializers, views.
- Django custom user model: Extending or replacing `User` (e.g. email as identifier, role field).
