import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { memoryOutbox } from "@/lib/email";

/** Xóa dữ liệu giữa các test integration (giữ nguyên cấu trúc bảng). */
export async function resetDatabase() {
  memoryOutbox.length = 0;
  await db.execute(sql`truncate table "session", "account", "verification", "user", "rate_limit_bucket", "role_assignment", "staff_invitation", "audit_log" cascade`);
}
