import { index, jsonb, pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { user } from "@/modules/identity/schema";
import { moduleReport } from "@/modules/learning/schema";

/** Mỗi lần TA kiểm hồ sơ hoặc mentor chấm một phiên bản báo cáo. */
export const reportReview = pgTable(
  "report_review",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => moduleReport.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    reviewerId: text("reviewer_id").references(() => user.id, { onDelete: "set null" }),
    kind: text("kind", { enum: ["precheck", "review"] }).notNull(),
    result: text("result", { enum: ["prechecked", "returned", "passed", "needs_revision"] }).notNull(),
    /** Với mentor: tiêu chí nào đạt (theo thứ tự reportCriteria của module). */
    criteriaMet: jsonb("criteria_met").$type<boolean[]>().notNull().default([]),
    comment: text("comment").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("report_review_report_idx").on(table.reportId)],
);
