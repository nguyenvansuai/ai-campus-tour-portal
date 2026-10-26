import { and, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { enrollment, type EnrollmentStatus } from "@/modules/enrollment/schema";
import { scheduleOf, studentResource } from "@/modules/enrollment/service";
import { authorize, scopeFilter, type Actor } from "@/modules/identity/policy";
import { user } from "@/modules/identity/schema";
import { lessonProgress, moduleReport } from "@/modules/learning/schema";
import { faculty, school, schoolClass } from "@/modules/org/schema";

const DAY = 86_400_000;
export const AT_RISK_DAYS = 7;

/** Điều kiện WHERE theo phạm vi dữ liệu của người xem. null = không được xem gì. */
export function enrollmentScopeCondition(actor: Actor): SQL | undefined | null {
  const filter = scopeFilter(actor);
  if ("none" in filter) return null;
  if ("all" in filter) return undefined;
  const parts: SQL[] = [];
  if (filter.schoolIds.length) parts.push(inArray(enrollment.schoolId, filter.schoolIds));
  if (filter.facultyIds.length) parts.push(inArray(enrollment.facultyId, filter.facultyIds));
  if (filter.classIds.length) parts.push(inArray(enrollment.classId, filter.classIds));
  if (filter.assignedToUserId) parts.push(or(eq(enrollment.mentorId, filter.assignedToUserId), eq(enrollment.taId, filter.assignedToUserId))!);
  parts.push(eq(enrollment.userId, filter.ownerUserId));
  return or(...parts)!;
}

export type DashboardQuery = { schoolId?: string; facultyId?: string; status?: EnrollmentStatus };

export async function listStudents(actor: Actor, query: DashboardQuery = {}) {
  const scope = enrollmentScopeCondition(actor);
  if (scope === null) return [];
  const conditions: SQL[] = [];
  if (scope) conditions.push(scope);
  if (query.schoolId) conditions.push(eq(enrollment.schoolId, query.schoolId));
  if (query.facultyId) conditions.push(eq(enrollment.facultyId, query.facultyId));
  if (query.status) conditions.push(eq(enrollment.status, query.status));

  const rows = await db
    .select({
      enrollment,
      name: user.name,
      email: user.email,
      schoolName: school.name,
      facultyName: faculty.name,
      className: schoolClass.name,
    })
    .from(enrollment)
    .innerJoin(user, eq(user.id, enrollment.userId))
    .innerJoin(school, eq(school.id, enrollment.schoolId))
    .leftJoin(faculty, eq(faculty.id, enrollment.facultyId))
    .leftJoin(schoolClass, eq(schoolClass.id, enrollment.classId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(school.name, faculty.name, schoolClass.name, user.name)
    .limit(5000);

  const ids = rows.map((r) => r.enrollment.id);
  const lessonCounts = ids.length
    ? await db
        .select({ enrollmentId: lessonProgress.enrollmentId, done: sql<number>`count(*) filter (where ${lessonProgress.spotCheckOk} is not false)` })
        .from(lessonProgress)
        .where(inArray(lessonProgress.enrollmentId, ids))
        .groupBy(lessonProgress.enrollmentId)
    : [];
  const reports = ids.length ? await db.select({ enrollmentId: moduleReport.enrollmentId, moduleId: moduleReport.moduleId, status: moduleReport.status }).from(moduleReport).where(inArray(moduleReport.enrollmentId, ids)) : [];

  const now = Date.now();
  return rows.map((r) => {
    const schedule = scheduleOf(r.enrollment);
    const myReports = reports.filter((rep) => rep.enrollmentId === r.enrollment.id);
    const inactiveDays = Math.floor((now - r.enrollment.lastActivityAt.getTime()) / DAY);
    return {
      enrollmentId: r.enrollment.id,
      name: r.name || r.email,
      email: r.email,
      studentCode: r.enrollment.studentCode,
      schoolId: r.enrollment.schoolId,
      schoolName: r.schoolName,
      facultyName: r.facultyName ?? "",
      className: r.className ?? "",
      track: r.enrollment.track,
      status: r.enrollment.status,
      dayNumber: Math.min(schedule.dayNumber, 30),
      lessonsDone: Number(lessonCounts.find((c) => c.enrollmentId === r.enrollment.id)?.done ?? 0),
      reportsPassed: myReports.filter((rep) => rep.status === "passed").length,
      reportsSubmitted: myReports.length,
      lastActivityAt: r.enrollment.lastActivityAt,
      inactiveDays,
      atRisk: (r.enrollment.status === "active" || r.enrollment.status === "inactive") && inactiveDays >= AT_RISK_DAYS,
    };
  });
}

export type StudentRow = Awaited<ReturnType<typeof listStudents>>[number];

export function summarize(rows: StudentRow[]) {
  const total = rows.length;
  const activeWeek = rows.filter((r) => r.inactiveDays < 7 && r.status !== "completed" && r.status !== "failed").length;
  return {
    total,
    activeWeek,
    avgLessons: total ? Math.round((rows.reduce((s, r) => s + r.lessonsDone, 0) / total) * 10) / 10 : 0,
    reportsPassed: rows.reduce((s, r) => s + r.reportsPassed, 0),
    completed: rows.filter((r) => r.status === "completed").length,
    atRisk: rows.filter((r) => r.atRisk).length,
  };
}

/** Gom theo khoa → lớp để hiển thị bảng. */
export function groupByFacultyAndClass(rows: StudentRow[]) {
  const groups = new Map<string, { label: string; rows: StudentRow[] }>();
  for (const row of rows) {
    const key = `${row.schoolName} – ${row.facultyName || "Chưa rõ khoa"}${row.className ? ` – ${row.className}` : ""}`;
    if (!groups.has(key)) groups.set(key, { label: key, rows: [] });
    groups.get(key)!.rows.push(row);
  }
  return [...groups.values()].map((g) => ({ label: g.label, ...summarize(g.rows) }));
}

const CSV_HEADERS = ["Họ tên", "Email", "MSSV", "Trường", "Khoa", "Lớp", "Khối", "Trạng thái", "Ngày", "Số buổi xong", "Báo cáo đạt", "Báo cáo đã nộp", "Hoạt động cuối", "Số ngày không hoạt động"];

function csvCell(value: unknown) {
  let text = value === null || value === undefined ? "" : String(value);
  // Chặn công thức Excel (CSV injection).
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** CSV UTF-8 có BOM để Excel hiển thị đúng tiếng Việt. */
export function toCsv(rows: StudentRow[]) {
  const lines = [CSV_HEADERS.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [r.name, r.email, r.studentCode, r.schoolName, r.facultyName, r.className, r.track, r.status, r.dayNumber, r.lessonsDone, r.reportsPassed, r.reportsSubmitted, r.lastActivityAt.toISOString(), r.inactiveDays]
        .map(csvCell)
        .join(","),
    );
  }
  return `﻿${lines.join("\r\n")}`;
}

export async function getStudentDetail(actor: Actor, enrollmentId: string) {
  const [row] = await db.select().from(enrollment).where(eq(enrollment.id, enrollmentId));
  if (!row) return null;
  authorize(actor, "student_record.view", studentResource(row));
  const [info] = await db
    .select({ name: user.name, email: user.email, phone: user.phone, schoolName: school.name })
    .from(user)
    .innerJoin(school, eq(school.id, row.schoolId))
    .where(eq(user.id, row.userId));
  const lessons = await db.select().from(lessonProgress).where(eq(lessonProgress.enrollmentId, row.id));
  const reports = await db.select().from(moduleReport).where(eq(moduleReport.enrollmentId, row.id)).orderBy(desc(moduleReport.moduleId));
  return { enrollment: row, info: info!, lessons, reports, schedule: scheduleOf(row) };
}
