import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LESSONS, MODULES } from "@/modules/curriculum/content/program";
import { TRACK_LABELS, type Track } from "@/modules/curriculum/types";
import { getLatestEnrollment, getOpenEnrollment } from "@/modules/enrollment/service";
import { requireSession } from "@/modules/identity/session";
import { dashboardFor, quizFor } from "@/modules/learning/service";

export const metadata: Metadata = { title: "Lộ trình của tôi · AI Campus Tour" };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });

const REPORT_STATUS: Record<string, string> = {
  submitted: "Đã nộp – chờ chấm",
  prechecked: "Đã kiểm hồ sơ – chờ mentor chấm",
  returned: "Bị trả lại – thiếu hồ sơ, cần nộp lại",
  needs_revision: "Cần sửa – xem nhận xét",
  passed: "Đạt",
};

export default async function StudentHomePage({ searchParams }: PageProps<"/hoc">) {
  const { user, actor } = await requireSession();
  const params = await searchParams;
  const row = await getOpenEnrollment(user.id);
  if (!row) {
    if (actor.roles.some((r) => r.role === "mentor" || r.role === "ta")) redirect("/nhan-su");
    if (actor.roles.length > 0) redirect("/admin");
    const latest = await getLatestEnrollment(user.id);
    if (!latest) redirect("/bat-dau");
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8">
        <h1 className="text-2xl font-bold">Lộ trình đã kết thúc</h1>
        <p>{latest.status === "completed" ? "Chúc mừng bạn đã hoàn thành lộ trình!" : "Lộ trình của bạn đã quá hạn. Vui lòng liên hệ ban tổ chức nếu muốn học lại."}</p>
      </main>
    );
  }

  const { progress, schedule, nextLesson, pendingReport } = await dashboardFor(row);
  const done = progress.completedLessons.size;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      {params.chao ? (
        <p role="status" className="rounded-lg bg-green-700/10 p-3 text-sm">
          Chào mừng bạn! Hôm nay là ngày 0. Bắt đầu với buổi 1 ngay tối nay nhé.
          {params["loi-ma"] ? ` (Mã workshop: ${String(params["loi-ma"])})` : ""}
        </p>
      ) : null}
      <section className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Khối {row.track}: {TRACK_LABELS[row.track as Track]}
        </p>
        <h1 className="text-2xl font-bold">
          Ngày {Math.min(schedule.dayNumber, 30)}/30 {schedule.isPaused ? "· Đang bảo lưu" : ""}
        </h1>
        <div className="h-3 w-full overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={12} aria-label="Tiến độ buổi học">
          <div className="h-full bg-primary" style={{ width: `${(done / 12) * 100}%` }} />
        </div>
        <p className="text-sm">{done}/12 buổi đã hoàn thành</p>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-primary/40 p-4">
        <h2 className="font-semibold">Việc tiếp theo</h2>
        {pendingReport ? (
          <Link href={`/hoc/bao-cao/${pendingReport}`} className="font-medium text-primary">
            Nộp báo cáo {pendingReport} (hạn {dateFormat.format(schedule.deadlines[pendingReport])}) →
          </Link>
        ) : nextLesson ? (
          <Link href={`/hoc/buoi/${nextLesson.number}`} className="font-medium text-primary">
            Buổi {nextLesson.number}: {nextLesson.title} (~{nextLesson.minutes} phút) →
          </Link>
        ) : (
          <p>Bạn đã làm hết phần đang mở. Chờ mentor chấm hoặc làm dự án cuối khi đủ điều kiện.</p>
        )}
      </section>

      {MODULES.filter((m) => m.lessonNumbers.length > 0).map((m) => {
        const report = progress.reports.get(m.id as "M1");
        const quiz = quizFor(row, m.id);
        const open = progress.unlocked[m.id];
        return (
          <section key={m.id} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">
                {m.id} · {m.title}
              </h2>
              <span className="text-xs text-muted-foreground">Ngày {m.startDay}–{m.endDay}</span>
            </div>
            {!open ? <p className="text-sm text-muted-foreground">Mở sau khi bạn nộp báo cáo module trước.</p> : null}
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {LESSONS.filter((l) => l.moduleId === m.id).map((lesson) => {
                const completed = progress.completedLessons.has(lesson.number);
                return (
                  <li key={lesson.number}>
                    {open ? (
                      <Link href={`/hoc/buoi/${lesson.number}`} className="flex items-center justify-between gap-3 p-3">
                        <span>
                          Buổi {lesson.number}: {lesson.title}
                        </span>
                        <span className={completed ? "text-green-700" : "text-muted-foreground"}>{completed ? "✓" : "○"}</span>
                      </Link>
                    ) : (
                      <span className="flex p-3 text-muted-foreground">
                        Buổi {lesson.number}: {lesson.title}
                      </span>
                    )}
                  </li>
                );
              })}
              {open && quiz ? (
                <li>
                  <Link href={`/hoc/trac-nghiem/${m.id}`} className="flex items-center justify-between gap-3 p-3">
                    <span>Trắc nghiệm kiến thức {m.id}</span>
                    <span className={progress.passedQuizzes.has(quiz.id) ? "text-green-700" : "text-muted-foreground"}>
                      {progress.passedQuizzes.has(quiz.id) ? "Đạt" : "Chưa làm"}
                    </span>
                  </Link>
                </li>
              ) : null}
              {open && m.reportCriteria ? (
                <li>
                  <Link href={`/hoc/bao-cao/${m.id}`} className="flex items-center justify-between gap-3 p-3">
                    <span>Báo cáo {m.id}</span>
                    <span className="text-right text-sm text-muted-foreground">{report ? REPORT_STATUS[report.status] : `Hạn ${dateFormat.format(schedule.deadlines[m.id as "M1"])}`}</span>
                  </Link>
                </li>
              ) : null}
            </ul>
          </section>
        );
      })}

      <section className="flex flex-col gap-2 rounded-xl border border-border p-4">
        <h2 className="font-semibold">M5 · Tốt nghiệp (ngày 29–30)</h2>
        <p className="text-sm text-muted-foreground">
          {progress.unlocked.M5 ? "Bạn đã đủ điều kiện nộp dự án cuối." : "Mở khi bạn đã nộp báo cáo M4 và học ít nhất 14 ngày."} Hạn dự án cuối:{" "}
          {dateFormat.format(schedule.deadlines.final)}.
        </p>
        {progress.unlocked.M5 ? (
          <Link href="/hoc/du-an" className="font-medium text-primary">
            Nộp dự án cuối →
          </Link>
        ) : null}
      </section>
    </main>
  );
}
