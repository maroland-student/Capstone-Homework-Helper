import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "../src/db";
import { accountsTable, sessionsTable, usersTable, verificationsTable } from "../src/db/schema";
import { sendOTPEmail } from "./email-service";


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
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "student",
        input: true,
      },
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        try {
          await sendOTPEmail({ email, otp, type });
        } catch (error) {
          console.error(`Failed to send OTP email to ${email}:`, error);
          if (process.env.NODE_ENV === 'production') {
            throw error;
          }
        }
      },
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      sendVerificationOnSignUp: false,
      disableSignUp: false,
      storeOTP: 'plain',
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:8081",
    "exp://localhost:8081",
    "exp://192.168.1.100:8081",
    "exp://10.0.2.2:8081",
    "exp://127.0.0.1:8081",
    "capstone-exploration://",
  ],
  baseURL: "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",
  cookies: {
    sessionToken: {
      name: "better-auth.session-token",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;