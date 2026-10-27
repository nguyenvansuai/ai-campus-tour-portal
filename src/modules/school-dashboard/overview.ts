import { and, count, eq, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { enrollment } from "@/modules/enrollment/schema";
import { moduleReport } from "@/modules/learning/schema";
import { certificate, finalProject } from "@/modules/project-certificate/schema";
import { school } from "@/modules/org/schema";

const total = async (query: Promise<{ value: number }[]>) => Number((await query)[0]?.value ?? 0);

/** Số liệu nhanh cho trang tổng quan quản trị (toàn hệ thống). */
export async function adminOverview(now = new Date()) {
  const [active, inactive, completed, waitingReports, overdueReports, waitingProjects, issued, passedProjects, pendingSchools] = await Promise.all([
    total(db.select({ value: count() }).from(enrollment).where(inArray(enrollment.status, ["active", "paused"]))),
    total(db.select({ value: count() }).from(enrollment).where(eq(enrollment.status, "inactive"))),
    total(db.select({ value: count() }).from(enrollment).where(eq(enrollment.status, "completed"))),
    total(db.select({ value: count() }).from(moduleReport).where(inArray(moduleReport.status, ["submitted", "prechecked"]))),
    total(db.select({ value: count() }).from(moduleReport).where(and(inArray(moduleReport.status, ["submitted", "prechecked"]), lt(moduleReport.reviewDueAt, now)))),
    total(db.select({ value: count() }).from(finalProject).where(inArray(finalProject.status, ["submitted", "awaiting_second"]))),
    total(db.select({ value: count() }).from(certificate).where(and(isNotNull(certificate.issuedAt), isNull(certificate.revokedAt)))),
    total(db.select({ value: count() }).from(finalProject).where(eq(finalProject.status, "passed"))),
    total(db.select({ value: count() }).from(school).where(eq(school.status, "pending"))),
  ]);
  // Dự án Đạt nhưng chưa cấp: gần đúng số hồ sơ đang chờ duyệt chứng nhận (có thể còn thiếu điều kiện khác).
  return { active, inactive, completed, waitingReports, overdueReports, waitingProjects, issued, awaitingCertificate: Math.max(0, passedProjects - issued), pendingSchools };
}
