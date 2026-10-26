import { auditLog } from "@/lib/audit-schema";
import { db, type Database } from "@/lib/db";

export type AuditEntry = {
  /** null khi hệ thống tự thực hiện (vd. lệnh CLI). */
  actorId: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  /** Không đưa OTP, token hay secret vào đây. */
  metadata?: Record<string, unknown>;
  ip?: string | null;
};

/** Truyền `executor` là transaction để nhật ký được ghi cùng (hoặc hủy cùng) thao tác chính. */
export async function recordAudit(entry: AuditEntry, executor: Pick<Database, "insert"> = db) {
  await executor.insert(auditLog).values({
    actorId: entry.actorId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId ?? null,
    metadata: entry.metadata ?? {},
    ip: entry.ip ?? null,
  });
}
