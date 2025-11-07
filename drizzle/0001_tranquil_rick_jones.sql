CREATE TABLE "assignment" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"teacherId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem" (
	"id" text PRIMARY KEY NOT NULL,
	"assignmentId" text NOT NULL,
	"question" text NOT NULL,
	"type" text NOT NULL,
	"answer" text NOT NULL,
	"options" jsonb,
	"difficulty" text NOT NULL,
	"orderIndex" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission" (
	"id" text PRIMARY KEY NOT NULL,
	"assignmentId" text NOT NULL,
	"studentId" text NOT NULL,
	"answers" jsonb NOT NULL,
	"score" integer NOT NULL,
	"submittedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_teacherId_user_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem" ADD CONSTRAINT "problem_assignmentId_assignment_id_fk" FOREIGN KEY ("assignmentId") REFERENCES "public"."assignment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_assignmentId_assignment_id_fk" FOREIGN KEY ("assignmentId") REFERENCES "public"."assignment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_studentId_user_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;