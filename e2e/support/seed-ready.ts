/**
 * Chỉ dùng cho E2E: đưa hồ sơ của một SV tới trạng thái đủ điều kiện nộp dự án cuối
 * (12 buổi xong, 4 báo cáo Đạt, đạt trắc nghiệm M1–M3, đã học 20 ngày).
 * Chạy: tsx e2e/support/seed-ready.ts <email>
 */
import { and, eq, inArray } from "drizzle-orm";
import { closeDb, db } from "@/lib/db";
import { LESSONS, quizIdFor } from "@/modules/curriculum/content/program";
import type { Track } from "@/modules/curriculum/types";
import { enrollment } from "@/modules/enrollment/schema";
import { user } from "@/modules/identity/schema";
import { lessonProgress, moduleReport, quizAttempt } from "@/modules/learning/schema";

async function main(email: string) {
  const [row] = await db
    .select({ enrollment })
    .from(enrollment)
    .innerJoin(user, eq(user.id, enrollment.userId))
    .where(and(eq(user.email, email), inArray(enrollment.status, ["active", "paused", "inactive"])));
  if (!row) throw new Error(`Không có hồ sơ đang mở cho ${email}`);
  const id = row.enrollment.id;
  const start = new Date(Date.now() - 20 * 86_400_000).toISOString().slice(0, 10);
  await db.update(enrollment).set({ startDate: start }).where(eq(enrollment.id, id));
  for (const lesson of LESSONS) {
    await db
      .insert(lessonProgress)
      .values({ enrollmentId: id, lessonNumber: lesson.number, evidence: { note: "Minh chứng E2E" }, reflectionMistake: "AI sai số liệu", reflectionVerify: "Đối chiếu nguồn gốc" })
      .onConflictDoNothing();
  }
  for (const moduleId of ["M1", "M2", "M3", "M4"] as const) {
    await db
      .insert(moduleReport)
      .values({ enrollmentId: id, moduleId, fields: { learned: "E2E" }, status: "passed", reviewDueAt: new Date() })
      .onConflictDoUpdate({ target: [moduleReport.enrollmentId, moduleReport.moduleId], set: { status: "passed" } });
  }
  for (const m of ["M1", "M2", "M3"] as const) {
    await db.insert(quizAttempt).values({ enrollmentId: id, quizId: quizIdFor(m, row.enrollment.track as Track)!, questionIds: [], score: 100, passed: true, submittedAt: new Date() });
  }
}

main(process.argv[2]!)
  .then(() => closeDb())
  .catch(async (error) => {
    console.error(error);
    await closeDb();
    process.exit(1);
  });
