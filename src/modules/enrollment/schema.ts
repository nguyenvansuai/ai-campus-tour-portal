import { sql } from "drizzle-orm";
import { date, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "@/modules/identity/schema";
import { activationCode, event, faculty, school, schoolClass } from "@/modules/org/schema";

export const ENROLLMENT_STATUSES = ["active", "paused", "inactive", "completed", "failed"] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

/** Hồ sơ học của một SV trong lộ trình 30 ngày. */
export const enrollment = pgTable(
  "enrollment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    programVersion: text("program_version").notNull(),
    track: text("track", { enum: ["A", "B", "C"] }).notNull(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => school.id),
    facultyId: uuid("faculty_id").references(() => faculty.id, { onDelete: "set null" }),
    classId: uuid("class_id").references(() => schoolClass.id, { onDelete: "set null" }),
    studentCode: text("student_code"),
    targetPosition: text("target_position"),
    eventId: uuid("event_id").references(() => event.id, { onDelete: "set null" }),
    activationCodeId: uuid("activation_code_id").references(() => activationCode.id, { onDelete: "set null" }),
    /** Ngày 0 theo giờ Việt Nam. */
    startDate: date("start_date", { mode: "string" }).notNull(),
    extensionDays: integer("extension_days").notNull().default(0),
    pausedDays: integer("paused_days").notNull().default(0),
    pausedSince: timestamp("paused_since", { withTimezone: true }),
    status: text("status", { enum: ENROLLMENT_STATUSES }).notNull().default("active"),
    tools: jsonb("tools").$type<string[]>().notNull().default([]),
    selfAssessmentStart: jsonb("self_assessment_start").$type<Record<string, number>>().notNull().default({}),
    selfAssessmentEnd: jsonb("self_assessment_end").$type<Record<string, number>>(),
    mentorId: text("mentor_id").references(() => user.id, { onDelete: "set null" }),
    taId: text("ta_id").references(() => user.id, { onDelete: "set null" }),
    /** Lần cuối SV có hoạt động học (tích buổi, nộp bài) – dùng cho nhắc nhở và trạng thái tạm dừng. */
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("enrollment_school_idx").on(table.schoolId),
    index("enrollment_mentor_idx").on(table.mentorId),
    // Mỗi SV chỉ có một hồ sơ đang mở.
    uniqueIndex("enrollment_open_unique")
      .on(table.userId)
      .where(sql`${table.status} in ('active', 'paused', 'inactive')`),
  ],
);
