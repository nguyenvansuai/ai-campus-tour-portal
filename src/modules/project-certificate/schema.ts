import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { enrollment } from "@/modules/enrollment/schema";
import { user } from "@/modules/identity/schema";
import { storedFile } from "@/modules/learning/schema";

export const FINAL_STATUSES = ["submitted", "awaiting_second", "needs_revision", "passed", "failed"] as const;

export const finalProject = pgTable(
  "final_project",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollment.id, { onDelete: "cascade" }),
    fields: jsonb("fields").$type<Record<string, string>>().notNull(),
    pdfFileId: uuid("pdf_file_id").references(() => storedFile.id, { onDelete: "set null" }),
    showProjectLink: boolean("show_project_link").notNull().default(true),
    version: integer("version").notNull().default(1),
    status: text("status", { enum: FINAL_STATUSES }).notNull().default("submitted"),
    finalScore: integer("final_score"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    reviewDueAt: timestamp("review_due_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("final_project_enrollment_unique").on(table.enrollmentId)],
);

export const finalScore = pgTable("final_score", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => finalProject.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  reviewerId: text("reviewer_id").references(() => user.id, { onDelete: "set null" }),
  scores: jsonb("scores").$type<Record<string, number>>().notNull(),
  total: integer("total").notNull(),
  comment: text("comment").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const certificate = pgTable(
  "certificate",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollment.id, { onDelete: "cascade" }),
    /** Trường đã kết nối tại thời điểm xét: cần thêm lượt duyệt của trường. */
    requiresSchool: boolean("requires_school").notNull(),
    schoolApprovedBy: text("school_approved_by").references(() => user.id, { onDelete: "set null" }),
    schoolApprovedAt: timestamp("school_approved_at", { withTimezone: true }),
    instituteApprovedBy: text("institute_approved_by").references(() => user.id, { onDelete: "set null" }),
    instituteApprovedAt: timestamp("institute_approved_at", { withTimezone: true }),
    /** Có mã khi đã cấp. */
    code: text("code").unique(),
    grade: text("grade", { enum: ["completed", "excellent"] }).notNull(),
    score: integer("score").notNull(),
    issuers: jsonb("issuers").$type<string[]>().notNull().default([]),
    studentName: text("student_name").notNull(),
    schoolName: text("school_name").notNull(),
    projectTitle: text("project_title").notNull(),
    projectUrl: text("project_url"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedReason: text("revoked_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("certificate_enrollment_unique").on(table.enrollmentId)],
);
