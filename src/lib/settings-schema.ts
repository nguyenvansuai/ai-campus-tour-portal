import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Cấu hình hệ thống do Super Admin đặt qua giao diện (vd. kết nối Google Drive). Giá trị bí mật được mã hóa. */
export const systemSetting = pgTable("system_setting", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
