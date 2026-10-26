CREATE TABLE "course_credit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"source" text NOT NULL,
	"course_id" text NOT NULL,
	"modules" jsonb NOT NULL,
	"external_id" text,
	"note" text DEFAULT '' NOT NULL,
	"recorded_by" text,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_reason" text,
	CONSTRAINT "course_credit_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "voucher" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"code" text NOT NULL,
	"claimed_by" text,
	"claimed_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "voucher_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "course_credit" ADD CONSTRAINT "course_credit_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_claimed_by_user_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_credit_email_idx" ON "course_credit" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "voucher_claim_unique" ON "voucher" USING btree ("kind","claimed_by");