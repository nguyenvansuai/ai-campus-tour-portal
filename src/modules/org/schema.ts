import { sql } from "drizzle-orm";
import { boolean, date, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "@/modules/identity/schema";

export const school = pgTable(
  "school",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    shortName: text("short_name"),
    /** Trường đã ký kết nối: chứng nhận có tên trường + Viện. */
    connected: boolean("connected").notNull().default(false),
    /** pending: do SV tự nhập, chờ admin xác minh. */
    status: text("status", { enum: ["verified", "pending"] }).notNull().default("verified"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("school_name_unique").on(sql`lower(${table.name})`)],
);

export const faculty = pgTable(
  "faculty",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => school.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("faculty_school_name_unique").on(table.schoolId, sql`lower(${table.name})`)],
);

export const schoolClass = pgTable(
  "class",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    facultyId: uuid("faculty_id")
      .notNull()
      .references(() => faculty.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("class_faculty_name_unique").on(table.facultyId, sql`lower(${table.name})`)],
);

export const event = pgTable(
  "event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => school.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    heldOn: date("held_on", { mode: "string" }).notNull(),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("event_school_id_idx").on(table.schoolId)],
);

export const activationCode = pgTable("activation_code", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => event.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  maxUses: integer("max_uses").notNull(),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
