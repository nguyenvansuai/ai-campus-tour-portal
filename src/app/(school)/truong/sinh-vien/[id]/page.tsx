import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LESSONS } from "@/modules/curriculum/content/program";
import { studentResource } from "@/modules/enrollment/service";
import { can } from "@/modules/identity/policy";
import { requireActor } from "@/modules/identity/session";
import { getStudentDetail } from "@/modules/school-dashboard/service";
import { AdjustButtons } from "@/modules/school-dashboard/ui/adjust-buttons";

export const metadata: Metadata = { title: "Chi tiết sinh viên · AI Campus Tour" };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });
const REPORT_STATUS: Record<string, string> = { submitted: "Chờ chấm", prechecked: "Chờ mentor", returned: "Trả lại", needs_revision: "Cần sửa", passed: "Đạt" };

export default async function StudentDetailPage({ params }: PageProps<"/truong/sinh-vien/[id]">) {
  const actor = await requireActor();
  const detail = await getStudentDetail(actor, (await params).id);
  if (!detail) notFound();
  const { enrollment: row, info, schedule } = detail;
  const done = new Set(detail.lessons.filter((l) => l.spotCheckOk !== false).map((l) => l.lessonNumber));
  const canAdjust = can(actor, "enrollment.adjust", studentResource(row));

  return (
    <main className="flex max-w-3xl flex-col gap-6">
      <Link href="/truong" className="text-sm text-primary">
        ← Danh sách
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{info.name || info.email}</h1>
        <p className="text-sm text-muted-foreground">
          {info.schoolName} · khối {row.track} · {row.status} · ngày {Math.min(schedule.dayNumber, 30)}/30
          {row.extensionDays ? " · đã gia hạn" : ""}
          {row.pausedDays ? ` · đã bảo lưu ${row.pausedDays} ngày` : ""}
        </p>
        <p className="text-sm">
          {info.email}
          {info.phone ? ` · ${info.phone}` : ""}
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Buổi học ({done.size}/12)</h2>
        <ul className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
          {LESSONS.map((l) => (
            <li key={l.number} className={done.has(l.number) ? "text-green-700" : "text-muted-foreground"}>
              {done.has(l.number) ? "✓" : "○"} Buổi {l.number}: {l.title}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Báo cáo module</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {(["M1", "M2", "M3", "M4"] as const).map((m) => {
            const report = detail.reports.find((r) => r.moduleId === m);
            return (
              <li key={m}>
                {m}: {report ? `${REPORT_STATUS[report.status]} (v${report.version})` : "Chưa nộp"} · hạn {dateFormat.format(schedule.deadlines[m])}
                {report && can(actor, "submission.view", studentResource(row, "submission")) && actor.roles.some((r) => ["mentor", "ta", "admin", "super_admin"].includes(r.role)) ? (
                  <Link href={`/nhan-su/bao-cao/${report.id}`} className="ml-2 text-primary">
                    Xem
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {canAdjust ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Điều chỉnh lộ trình</h2>
          <AdjustButtons enrollmentId={row.id} paused={Boolean(row.pausedSince)} extended={row.extensionDays > 0} />
        </section>
      ) : null}
    </main>
  );
}
