CREATE TABLE "role_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"scope_type" text DEFAULT 'global' NOT NULL,
	"scope_id" text,
	"granted_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "role_assignment" ADD CONSTRAINT "role_assignment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignment" ADD CONSTRAINT "role_assignment_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "role_assignment_user_id_idx" ON "role_assignment" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_assignment_active_unique" ON "role_assignment" USING btree ("user_id","role","scope_type",coalesce("scope_id", '')) WHERE "role_assignment"."revoked_at" is null;