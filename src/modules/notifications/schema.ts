import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/** Thông báo đã gửi; unique để mỗi mốc chỉ gửi một lần. */
export const notificationLog = pgTable(
  "notification_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipientId: text("recipient_id").notNull(),
    kind: text("kind").notNull(),
    ref: text("ref").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("notification_log_unique").on(table.recipientId, table.kind, table.ref)],
);
