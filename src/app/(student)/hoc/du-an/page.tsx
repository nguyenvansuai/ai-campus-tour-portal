import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FINAL_RUBRIC, PASS_SCORE } from "@/modules/curriculum/content/program";
import { getLatestEnrollment, scheduleOf } from "@/modules/enrollment/service";
import { requireSession } from "@/modules/identity/session";
import { getProgress } from "@/modules/learning/service";
import { FINAL_STATUS_LABELS } from "@/modules/project-certificate/fields";
import { finalOverviewFor } from "@/modules/project-certificate/service";
import { FinalForm } from "@/modules/project-certificate/ui/final-form";

export const metadata: Metadata = { title: "Dự án cuối · AI Campus Tour" };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });

export default async function FinalProjectPage() {
  const { user } = await requireSession();
  const row = await getLatestEnrollment(user.id);
  if (!row) redirect("/bat-dau");
  const [progress, overview] = await Promise.all([getProgress(row.id), finalOverviewFor(row)]);
  const { project, feedback, eligibility, certificate } = overview;
  const isOpen = ["active", "paused", "inactive"].includes(row.status);
  if (!progress.unlocked.M5 && !project) redirect("/hoc");

  const canSubmit = isOpen && progress.unlocked.M5 && (!project || project.status === "needs_revision");
  const schedule = scheduleOf(row);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/hoc" className="text-sm text-primary">
        ← Lộ trình
      </Link>
      <h1 className="text-2xl font-bold">Dự án cuối · Tốt nghiệp</h1>

      {certificate?.issuedAt && certificate.code ? (
        <section className="flex flex-col gap-2 rounded-xl border border-green-700/40 bg-green-700/10 p-4">
          <h2 className="font-semibold">Chứng nhận đã được cấp</h2>
          <p className="text-sm">Mã chứng nhận: {certificate.code}</p>
          <Link href={`/chung-nhan/${certificate.code}`} className="font-medium text-primary">
            Xem và in chứng nhận →
          </Link>
        </section>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Hạn nộp: {dateFormat.format(schedule.deadlines.final)}. Nâng quy trình M4 thành dự án giải 1 việc thật, đăng bài chia sẻ công khai và nộp 1 đơn ứng tuyển thật bằng CV mới.
      </p>

      {project ? (
        <section className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <h2 className="font-semibold">
            Trạng thái: {FINAL_STATUS_LABELS[project.status]}
            {project.finalScore !== null ? ` · ${project.finalScore} điểm` : ""}
          </h2>
          <p className="text-sm text-muted-foreground">
            Lần nộp {project.version} · {dateFormat.format(project.submittedAt)}
          </p>
          {project.status === "awaiting_second" ? <p className="text-sm">Dự án đạt điểm cao nên cần thêm một mentor chấm độc lập. Kết quả sẽ có sớm.</p> : null}
          {project.status === "needs_revision" ? <p className="text-sm">Bạn được nộp lại 1 lần. Xem nhận xét bên dưới.</p> : null}
        </section>
      ) : null}

      {feedback.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Nhận xét của mentor</h2>
          {feedback.map((f, i) => (
            <div key={i} className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">
                Lần nộp {f.version} · {f.total}/100 · {dateFormat.format(f.createdAt)}
              </p>
              <p className="text-muted-foreground">{FINAL_RUBRIC.map((r) => `${r.label}: ${f.scores[r.key] ?? 0}/${r.max}`).join(" · ")}</p>
              {f.comment ? <p className="whitespace-pre-wrap">{f.comment}</p> : null}
            </div>
          ))}
        </section>
      ) : null}

      <section className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <h2 className="font-semibold">Điều kiện nhận chứng nhận</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {eligibility.checks.map((c) => (
            <li key={c.label}>
              {c.ok ? "✅" : "⬜"} {c.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <h2 className="font-semibold">Mentor chấm theo thang 100 (Đạt từ {PASS_SCORE})</h2>
        <ul className="list-disc pl-5 text-sm">
          {FINAL_RUBRIC.map((r) => (
            <li key={r.key}>
              {r.label}: {r.max} điểm
            </li>
          ))}
        </ul>
      </section>

      {isOpen ? (
        <FinalForm
          draft={project?.fields ?? {}}
          start={row.selfAssessmentStart}
          canSubmit={canSubmit}
          blockedReason={project?.status === "passed" ? "Dự án đã Đạt." : project && project.status !== "needs_revision" ? "Dự án đang chờ chấm." : undefined}
        />
      ) : null}
    </main>
  );
}
