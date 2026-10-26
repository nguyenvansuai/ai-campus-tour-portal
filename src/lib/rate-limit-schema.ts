import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Bộ đếm giới hạn tần suất theo khung thời gian cố định, dùng chung cho mọi module. */
export const rateLimitBucket = pgTable("rate_limit_bucket", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});
