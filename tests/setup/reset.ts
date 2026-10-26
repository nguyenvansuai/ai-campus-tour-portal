import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { memoryOutbox } from "@/lib/email";

/** Xóa dữ liệu giữa các test integration (giữ nguyên cấu trúc bảng). */
export async function resetDatabase() {
  memoryOutbox.length = 0;
  await db.execute(sql`truncate table "session", "account", "verification", "user", "rate_limit_bucket", "role_assignment", "staff_invitation", "consent", "audit_log", "certificate", "final_score", "final_project", "notification_log", "system_setting", "stored_file", "report_review", "module_report_version", "module_report", "quiz_attempt", "lesson_progress", "enrollment", "activation_code", "event", "class", "faculty", "school" cascade`);
}
