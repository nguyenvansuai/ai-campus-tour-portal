import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { enrollment } from "@/modules/enrollment/schema";
import { user } from "@/modules/identity/schema";

/** Giá trị minh chứng: chuỗi/số, hoặc file đã lưu. */
export type EvidenceValue = string | number | { fileId: string; name: string; type: string; size: number };

/** Kết quả tự luyện của SV cho từng buổi. */
export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollment.id, { onDelete: "cascade" }),
    lessonNumber: integer("lesson_number").notNull(),
    evidence: jsonb("evidence").$type<Record<string, EvidenceValue>>().notNull(),
    reflectionMistake: text("reflection_mistake").notNull(),
    reflectionVerify: text("reflection_verify").notNull(),
    sourceCodes: jsonb("source_codes").$type<string[]>().notNull().default([]),
    /** TA kiểm ngẫu nhiên: null = chưa kiểm, true = hợp lệ, false = không hợp lệ (bỏ tích). */
    spotCheckOk: boolean("spot_check_ok"),
    spotCheckNote: text("spot_check_note"),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("lesson_progress_unique").on(table.enrollmentId, table.lessonNumber)],
);

export const quizAttempt = pgTable(
  "quiz_attempt",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollment.id, { onDelete: "cascade" }),
    quizId: text("quiz_id").notNull(),
    questionIds: jsonb("question_ids").$type<string[]>().notNull(),
    answers: jsonb("answers").$type<Record<string, number>>(),
    score: integer("score"),
    passed: boolean("passed"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
  },
  (table) => [index("quiz_attempt_enrollment_idx").on(table.enrollmentId, table.quizId)],
);

export const REPORT_STATUSES = ["submitted", "prechecked", "returned", "needs_revision", "passed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Báo cáo module (M1–M4). Mỗi lần nộp lại tăng `version` và lưu bản cũ vào module_report_version. */
export const moduleReport = pgTable(
  "module_report",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollment.id, { onDelete: "cascade" }),
    moduleId: text("module_id", { enum: ["M1", "M2", "M3", "M4"] }).notNull(),
    fields: jsonb("fields").$type<Record<string, string>>().notNull(),
    version: integer("version").notNull().default(1),
    status: text("status", { enum: REPORT_STATUSES }).notNull().default("submitted"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    /** Hạn phản hồi của nhân sự (nộp + 3 ngày). */
    reviewDueAt: timestamp("review_due_at", { withTimezone: true }).notNull(),
    late: boolean("late").notNull().default(false),
  },
  (table) => [uniqueIndex("module_report_unique").on(table.enrollmentId, table.moduleId), index("module_report_due_idx").on(table.status, table.reviewDueAt)],
);

export const moduleReportVersion = pgTable("module_report_version", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id")
    .notNull()
    .references(() => moduleReport.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  fields: jsonb("fields").$type<Record<string, string>>().notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
});

/** File minh chứng đã lưu (Drive hoặc thư mục local). */
export const storedFile = pgTable("stored_file", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id")
    .notNull()
    .references(() => enrollment.id, { onDelete: "cascade" }),
  uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
  driver: text("driver", { enum: ["local", "drive"] }).notNull(),
  externalId: text("external_id").notNull(),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
