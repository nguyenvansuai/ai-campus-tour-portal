import { index, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "@/modules/identity/schema";

/** Giờ hỗ trợ trực tuyến trên meet.suai.vn. */
export const supportSession = pgTable(
  "support_session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    room: text("room").notNull().unique(),
    note: text("note").notNull().default(""),
    hostId: text("host_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (table) => [index("support_session_starts_idx").on(table.startsAt)],
);

export const sessionAttendance = pgTable(
  "session_attendance",
  {
    sessionId: uuid("session_id")
      .notNull()
      .references(() => supportSession.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.sessionId, table.userId] })],
);
