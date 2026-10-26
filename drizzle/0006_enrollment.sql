CREATE TABLE "enrollment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"program_version" text NOT NULL,
	"track" text NOT NULL,
	"school_id" uuid NOT NULL,
	"faculty_id" uuid,
	"class_id" uuid,
	"student_code" text,
	"target_position" text,
	"event_id" uuid,
	"activation_code_id" uuid,
	"start_date" date NOT NULL,
	"extension_days" integer DEFAULT 0 NOT NULL,
	"paused_days" integer DEFAULT 0 NOT NULL,
	"paused_since" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"self_assessment_start" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"self_assessment_end" jsonb,
	"mentor_id" text,
	"ta_id" text,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_class_id_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."class"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_activation_code_id_activation_code_id_fk" FOREIGN KEY ("activation_code_id") REFERENCES "public"."activation_code"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_mentor_id_user_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_ta_id_user_id_fk" FOREIGN KEY ("ta_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enrollment_school_idx" ON "enrollment" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "enrollment_mentor_idx" ON "enrollment" USING btree ("mentor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_open_unique" ON "enrollment" USING btree ("user_id") WHERE "enrollment"."status" in ('active', 'paused', 'inactive');