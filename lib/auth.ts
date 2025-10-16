import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../src/db";
import { accountsTable, sessionsTable, usersTable, verificationsTable } from "../src/db/schema";

console.log('🔧 Initializing Better Auth...');

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: usersTable,
      session: sessionsTable,
      account: accountsTable,
      verification: verificationsTable,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
    minPasswordLength: 6,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:8081",
    "exp://localhost:8081",
    "exp://192.168.1.100:8081",
    "exp://10.0.2.2:8081",
    "exp://127.0.0.1:8081",
    "capstone-exploration://",
    "capstone-exploration:///(tabs)/explore",
    "capstone-exploration:///(tabs)/",
    "capstone-exploration:///(tabs)/index",
    "capstone-exploration:///(tabs)/settings",
    "/(tabs)/explore",
    "/(tabs)/",
    "/(tabs)/index",
    "/(tabs)/settings",
    "/",
  ],
  baseURL: "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
