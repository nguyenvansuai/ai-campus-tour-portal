CREATE TABLE "report_review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"reviewer_id" text,
	"kind" text NOT NULL,
	"result" text NOT NULL,
	"criteria_met" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report_review" ADD CONSTRAINT "report_review_report_id_module_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."module_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_review" ADD CONSTRAINT "report_review_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "report_review_report_idx" ON "report_review" USING btree ("report_id");