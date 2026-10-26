CREATE TABLE "consent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"consent_key" text NOT NULL,
	"terms_version" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "consent" ADD CONSTRAINT "consent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consent_user_id_idx" ON "consent" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "consent_active_unique" ON "consent" USING btree ("user_id","consent_key","terms_version") WHERE "consent"."withdrawn_at" is null;