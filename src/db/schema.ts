import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["teacher", "student"]);

// Better Auth required tables
export const usersTable = pgTable("user", {
  id: text("id").primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  name: varchar({ length: 255 }),
  image: text("image"),
  role: roleEnum("role").notNull().default("student"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const sessionsTable = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
});

export const accountsTable = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const verificationsTable = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const assignmentsTable = pgTable("assignment", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  teacherId: text("teacherId")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const problemsTable = pgTable("problem", {
  id: text("id").primaryKey(),
  assignmentId: text("assignmentId")
    .notNull()
    .references(() => assignmentsTable.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  type: text("type").notNull(),
  answer: text("answer").notNull(),
  options: jsonb("options"),
  difficulty: text("difficulty").notNull(),
  orderIndex: integer("orderIndex").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const submissionsTable = pgTable("submission", {
  id: text("id").primaryKey(),
  assignmentId: text("assignmentId")
    .notNull()
    .references(() => assignmentsTable.id, { onDelete: "cascade" }),
  studentId: text("studentId")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  answers: jsonb("answers").notNull(),
  score: integer("score").notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});

// Type exports
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Assignment = typeof assignmentsTable.$inferSelect;
export type NewAssignment = typeof assignmentsTable.$inferInsert;

export type Problem = typeof problemsTable.$inferSelect;
export type NewProblem = typeof problemsTable.$inferInsert;

export type Submission = typeof submissionsTable.$inferSelect;
export type NewSubmission = typeof submissionsTable.$inferInsert;