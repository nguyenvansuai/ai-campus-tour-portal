import type { Metadata } from "next";
import Link from "next/link";
import { ENROLLMENT_STATUSES, type EnrollmentStatus } from "@/modules/enrollment/schema";
import { requireActor } from "@/modules/identity/session";
import { groupByFacultyAndClass, listStudents, summarize } from "@/modules/school-dashboard/service";

export const metadata: Metadata = { title: "Tiến độ sinh viên · AI Campus Tour" };

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  active: "Đang học",
  paused: "Bảo lưu",
  inactive: "Tạm dừng (không hoạt động)",
  completed: "Hoàn thành",
  failed: "Chưa hoàn thành",
};
const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });

export default async function SchoolDashboardPage({ searchParams }: PageProps<"/truong">) {
  const actor = await requireActor();
  const params = await searchParams;
  const schoolId = typeof params.truong === "string" && params.truong ? params.truong : undefined;
  const status = typeof params.trang_thai === "string" && (ENROLLMENT_STATUSES as readonly string[]).includes(params.trang_thai) ? (params.trang_thai as EnrollmentStatus) : undefined;
  const all = await listStudents(actor);
  const schools = [...new Map(all.map((r) => [r.schoolId, r.schoolName])).entries()];
  const rows = all.filter((r) => (!schoolId || r.schoolId === schoolId) && (!status || r.status === status));
  const summary = summarize(rows);
  const groups = groupByFacultyAndClass(rows);
  const csvHref = `/truong/xuat-csv?${new URLSearchParams({ truong: schoolId ?? "", trang_thai: status ?? "" })}`;

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Tiến độ sinh viên</h1>
      <form className="flex flex-col gap-2 sm:flex-row" role="search">
        {schools.length > 1 ? (
          <select name="truong" defaultValue={schoolId ?? ""} aria-label="Trường" className="h-12 rounded-lg border border-border bg-background px-3">
            <option value="">Mọi trường</option>
            {schools.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        ) : null}
        <select name="trang_thai" defaultValue={status ?? ""} aria-label="Trạng thái" className="h-12 rounded-lg border border-border bg-background px-3">
          <option value="">Mọi trạng thái</option>
          {ENROLLMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="submit" className="h-12 rounded-lg border border-border px-5 font-medium">
          Lọc
        </button>
        <a href={csvHref} className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-5 font-medium text-primary-foreground">
          Xuất Excel (CSV)
        </a>
      </form>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        {[
          ["Đăng ký", summary.total],
          ["Hoạt động 7 ngày", summary.activeWeek],
          ["TB số buổi", summary.avgLessons],
          ["Báo cáo Đạt", summary.reportsPassed],
          ["Hoàn thành", summary.completed],
          ["Có nguy cơ", summary.atRisk],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex flex-col rounded-lg border border-border p-3">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-2xl font-bold">{value}</span>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Theo khoa / lớp</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-2">Khoa / lớp</th>
                <th className="p-2">SV</th>
                <th className="p-2">Hoạt động 7 ngày</th>
                <th className="p-2">TB buổi</th>
                <th className="p-2">Báo cáo Đạt</th>
                <th className="p-2">Hoàn thành</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.label} className="border-b border-border">
                  <td className="p-2">{g.label}</td>
                  <td className="p-2">{g.total}</td>
                  <td className="p-2">{g.activeWeek}</td>
                  <td className="p-2">{g.avgLessons}</td>
                  <td className="p-2">{g.reportsPassed}</td>
                  <td className="p-2">{g.completed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Sinh viên ({rows.length})</h2>
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {rows.map((r) => (
            <li key={r.enrollmentId}>
              <Link href={`/truong/sinh-vien/${r.enrollmentId}`} className="flex flex-col gap-1 p-3 hover:bg-foreground/5 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium">
                  {r.name}
                  {r.atRisk ? <span className="ml-2 text-sm text-destructive">({r.inactiveDays} ngày không hoạt động)</span> : null}
                </span>
                <span className="text-sm text-muted-foreground">
                  {r.facultyName} {r.className} · {STATUS_LABELS[r.status]} · ngày {r.dayNumber}/30 · {r.lessonsDone}/12 buổi · {r.reportsPassed}/4 báo cáo Đạt · hoạt động {dateFormat.format(r.lastActivityAt)}
                </span>
              </Link>
            </li>
          ))}
          {rows.length === 0 ? <li className="p-3 text-muted-foreground">Chưa có sinh viên trong phạm vi của bạn.</li> : null}
        </ul>
      </section>
    </main>
  );
}
