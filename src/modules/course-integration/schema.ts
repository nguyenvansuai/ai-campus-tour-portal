import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "@/modules/identity/schema";

export const CREDIT_MODULES = ["M1", "M2", "M3"] as const;
export type CreditModule = (typeof CREDIT_MODULES)[number];

/** Ghi nhận SV đã học khóa Sự AI (N1). Lưu theo email để SV học trước rồi mới đăng ký portal vẫn được tính. */
export const courseCredit = pgTable(
  "course_credit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    source: text("source", { enum: ["tutor", "manual"] }).notNull(),
    courseId: text("course_id").notNull(),
    modules: jsonb("modules").$type<CreditModule[]>().notNull(),
    /** eventId từ suai.vn, chống ghi trùng. */
    externalId: text("external_id").unique(),
    note: text("note").notNull().default(""),
    recordedBy: text("recorded_by").references(() => user.id, { onDelete: "set null" }),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedReason: text("revoked_reason"),
  },
  (table) => [index("course_credit_email_idx").on(table.email)],
);

export const VOUCHER_KINDS = ["free_seat", "discount"] as const;
export type VoucherKind = (typeof VOUCHER_KINDS)[number];

/** Mã ưu đãi khóa Sự AI (tạo sẵn trên suai.vn, admin dán vào portal). */
export const voucher = pgTable(
  "voucher",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind", { enum: VOUCHER_KINDS }).notNull(),
    code: text("code").notNull().unique(),
    claimedBy: text("claimed_by").references(() => user.id, { onDelete: "set null" }),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("voucher_claim_unique").on(table.kind, table.claimedBy)],
);
