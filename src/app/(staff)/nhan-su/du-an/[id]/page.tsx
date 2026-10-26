import type { Metadata } from "next";
import Link from "next/link";
import { FINAL_RUBRIC } from "@/modules/curriculum/content/program";
import { requireActor } from "@/modules/identity/session";
import { FINAL_FIELDS, FINAL_STATUS_LABELS } from "@/modules/project-certificate/fields";
import { getProjectForScoring } from "@/modules/project-certificate/service";
import { ScoreForm } from "@/modules/project-certificate/ui/staff-forms";

export const metadata: Metadata = { title: "Chấm dự án cuối · AI Campus Tour" };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });

export default async function ScoreProjectPage({ params }: PageProps<"/nhan-su/du-an/[id]">) {
  const actor = await requireActor();
  const { project, enrollment: row, student, scores } = await getProjectForScoring(actor, (await params).id);
  const waiting = project.status === "submitted" || project.status === "awaiting_second";
  // Chấm lần 2 độc lập: không xem điểm lần 1 của phiên bản hiện tại trước khi chấm.
  const visibleScores = project.status === "awaiting_second" ? scores.filter((s) => s.score.version !== project.version) : scores;
  const alreadyScored = scores.some((s) => s.score.version === project.version && s.score.reviewerId === actor.userId);

  return (
    <main className="flex flex-col gap-6">
      <Link href="/nhan-su/du-an" className="text-sm text-primary">
        ← Dự án chờ chấm
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{project.fields.title}</h1>
        <p className="text-sm text-muted-foreground">
          {student.name || student.email} · {student.schoolName} · khối {row.track} · lần nộp {project.version} · {dateFormat.format(project.submittedAt)} · {FINAL_STATUS_LABELS[project.status]}
        </p>
      </div>

      <section className="flex flex-col gap-3">
        {FINAL_FIELDS.map((field) => {
          const value = project.fields[field.key] ?? "";
          return (
            <div key={field.key} className="flex flex-col gap-1">
              <span className="text-sm font-medium">{field.label}</span>
              {field.type === "link" ? (
                <a href={value} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline">
                  {value}
                </a>
              ) : (
                <p className="whitespace-pre-wrap rounded-lg bg-foreground/5 p-3">{value || "—"}</p>
              )}
            </div>
          );
        })}
        {project.pdfFileId ? (
          <a href={`/api/files/${project.pdfFileId}`} target="_blank" rel="noopener" className="font-medium text-primary underline">
            Mở file PDF dự án
          </a>
        ) : null}
      </section>

      {visibleScores.length ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Lịch sử chấm</h2>
          {visibleScores.map(({ score, reviewerName, reviewerEmail }) => (
            <p key={score.id} className="text-sm">
              Lần nộp {score.version} · {reviewerName || reviewerEmail} · {score.total}/100 · {FINAL_RUBRIC.map((r) => `${score.scores[r.key]}`).join("/")}
              {score.comment ? ` · ${score.comment}` : ""}
            </p>
          ))}
        </section>
      ) : null}

      {waiting && !alreadyScored ? (
        <section className="flex flex-col gap-3 rounded-xl border border-primary/40 p-4">
          <h2 className="text-lg font-semibold">{project.status === "awaiting_second" ? "Chấm lần 2 (độc lập)" : "Chấm"}</h2>
          <ScoreForm projectId={project.id} />
        </section>
      ) : null}
      {alreadyScored && project.status === "awaiting_second" ? <p className="text-sm text-muted-foreground">Bạn đã chấm lần 1, cần mentor khác chấm lần 2.</p> : null}
    </main>
  );
}
