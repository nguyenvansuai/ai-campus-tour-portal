import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MODULES } from "@/modules/curriculum/content/program";
import type { ReportModuleId } from "@/modules/enrollment/schedule";
import { getOpenEnrollment, scheduleOf } from "@/modules/enrollment/service";
import { requireSession } from "@/modules/identity/session";
import { buildReportDraft, getProgress } from "@/modules/learning/service";
import { ReportForm } from "@/modules/learning/ui/report-form";
import { reviewHistory } from "@/modules/review/service";

export const metadata: Metadata = { title: "Báo cáo module · AI Campus Tour" };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });

export default async function ReportPage({ params }: PageProps<"/hoc/bao-cao/[module]">) {
  const { user } = await requireSession();
  const row = await getOpenEnrollment(user.id);
  if (!row) redirect("/bat-dau");
  const moduleId = (await params).module as ReportModuleId;
  const programModule = MODULES.find((m) => m.id === moduleId && m.reportCriteria);
  if (!programModule) notFound();
  const progress = await getProgress(row.id);
  if (!progress.unlocked[moduleId]) redirect("/hoc");

  const report = progress.reports.get(moduleId);
  const missing = programModule.lessonNumbers.filter((n) => !progress.completedLessons.has(n));
  const canResubmit = report && (report.status === "returned" || report.status === "needs_revision");
  const canSubmit = missing.length === 0 && (!report || Boolean(canResubmit));
  const draft = report ? report.fields : await buildReportDraft(row, moduleId);
  const history = report ? await reviewHistory(report.id) : [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/hoc" className="text-sm text-primary">
        ← Lộ trình
      </Link>
      <h1 className="text-2xl font-bold">
        Báo cáo {moduleId} · {programModule.title}
      </h1>
      <p className="text-sm text-muted-foreground">Hạn nộp: {dateFormat.format(scheduleOf(row).deadlines[moduleId])}. Portal đã tự gom minh chứng các buổi, bạn chỉnh lại cho đúng ý.</p>

      <section className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <h2 className="font-semibold">Mentor chấm Đạt khi</h2>
        <ul className="list-disc pl-5 text-sm">
          {programModule.reportCriteria!.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      {history.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Nhận xét</h2>
          {history.map((h) => (
            <div key={h.id} className="flex flex-col gap-1 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">
                {h.label} · phiên bản {h.version} · {dateFormat.format(h.createdAt)}
              </p>
              {h.unmet.length ? <p className="text-sm">Chưa đạt: {h.unmet.join("; ")}</p> : null}
              <p className="whitespace-pre-wrap">{h.comment}</p>
            </div>
          ))}
        </section>
      ) : null}

      <ReportForm
        moduleId={moduleId}
        draft={draft}
        canSubmit={canSubmit}
        blockedReason={
          missing.length
            ? `Hoàn thành buổi ${missing.join(", ")} trước khi nộp.`
            : report?.status === "passed"
              ? "Báo cáo đã Đạt."
              : report
                ? "Báo cáo đang chờ chấm."
                : undefined
        }
      />
    </main>
  );
}
