CREATE TABLE "certificate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"requires_school" boolean NOT NULL,
	"school_approved_by" text,
	"school_approved_at" timestamp with time zone,
	"institute_approved_by" text,
	"institute_approved_at" timestamp with time zone,
	"code" text,
	"grade" text NOT NULL,
	"score" integer NOT NULL,
	"issuers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"student_name" text NOT NULL,
	"school_name" text NOT NULL,
	"project_title" text NOT NULL,
	"project_url" text,
	"issued_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revoked_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificate_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "final_project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"fields" jsonb NOT NULL,
	"pdf_file_id" uuid,
	"show_project_link" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"final_score" integer,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"review_due_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "final_score" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"reviewer_id" text,
	"scores" jsonb NOT NULL,
	"total" integer NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_enrollment_id_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_school_approved_by_user_id_fk" FOREIGN KEY ("school_approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_institute_approved_by_user_id_fk" FOREIGN KEY ("institute_approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_project" ADD CONSTRAINT "final_project_enrollment_id_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_project" ADD CONSTRAINT "final_project_pdf_file_id_stored_file_id_fk" FOREIGN KEY ("pdf_file_id") REFERENCES "public"."stored_file"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_score" ADD CONSTRAINT "final_score_project_id_final_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."final_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_score" ADD CONSTRAINT "final_score_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "certificate_enrollment_unique" ON "certificate" USING btree ("enrollment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "final_project_enrollment_unique" ON "final_project" USING btree ("enrollment_id");