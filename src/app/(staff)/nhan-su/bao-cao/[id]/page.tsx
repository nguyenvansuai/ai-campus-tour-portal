import type { Metadata } from "next";
import Link from "next/link";
import { REPORT_FIELDS } from "@/modules/curriculum/content/program";
import { can } from "@/modules/identity/policy";
import { requireActor } from "@/modules/identity/session";
import { studentResource } from "@/modules/enrollment/service";
import type { EvidenceValue } from "@/modules/learning/schema";
import { getReportForReview } from "@/modules/review/service";
import { COMMON_TEMPLATES, MODULE_TEMPLATES } from "@/modules/review/templates";
import { PrecheckForm, ReviewForm, SpotCheckForm } from "@/modules/review/ui/review-forms";

export const metadata: Metadata = { title: "Chấm báo cáo · AI Campus Tour" };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });

function Evidence({ value }: { value: EvidenceValue }) {
  if (typeof value === "object") {
    return (
      <a href={`/api/files/${value.fileId}`} target="_blank" rel="noopener" className="text-primary underline">
        Xem file: {value.name}
      </a>
    );
  }
  const text = String(value);
  if (/^https?:\/\//.test(text)) {
    return (
      <a href={text} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline">
        {text}
      </a>
    );
  }
  return <span className="whitespace-pre-wrap">{text}</span>;
}

export default async function ReviewPage({ params }: PageProps<"/nhan-su/bao-cao/[id]">) {
  const actor = await requireActor();
  const detail = await getReportForReview(actor, (await params).id);
  const resource = studentResource(detail.enrollment, "submission");
  const canReview = can(actor, "submission.review", resource);
  const canPrecheck = can(actor, "submission.precheck", resource);
  const waiting = detail.report.status === "submitted" || detail.report.status === "prechecked";
  const fieldLabel = new Map(REPORT_FIELDS.map((f) => [f.key, f.label]));

  return (
    <main className="flex flex-col gap-6">
      <Link href="/nhan-su" className="text-sm text-primary">
        ← Hàng đợi
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">
          Báo cáo {detail.report.moduleId} · {detail.student.name || detail.student.email}
        </h1>
        <p className="text-sm text-muted-foreground">
          {detail.student.schoolName} · khối {detail.enrollment.track} · phiên bản {detail.report.version} · nộp {dateFormat.format(detail.report.submittedAt)}
          {detail.report.late ? " · nộp trễ" : ""}
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Báo cáo</h2>
        {Object.entries(detail.report.fields).map(([key, value]) => (
          <div key={key} className="flex flex-col gap-1">
            <span className="text-sm font-medium">{fieldLabel.get(key as "learned") ?? key}</span>
            <p className="whitespace-pre-wrap rounded-lg bg-foreground/5 p-3">{value || "—"}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Minh chứng từng buổi</h2>
        {detail.lessons.map((lesson) => (
          <div key={lesson.id} className="flex flex-col gap-2 rounded-lg border border-border p-4">
            <p className="font-medium">
              Buổi {lesson.lessonNumber}: {lesson.title}
              {lesson.spotCheckOk === false ? <span className="ml-2 text-destructive">(không hợp lệ)</span> : null}
              {lesson.spotCheckOk === true ? <span className="ml-2 text-green-700">(đã kiểm)</span> : null}
            </p>
            <ul className="flex flex-col gap-2 text-sm">
              {Object.entries(lesson.evidence).map(([key, value]) => (
                <li key={key}>
                  <Evidence value={value} />
                </li>
              ))}
              <li>
                <strong>AI sai ở đâu:</strong> {lesson.reflectionMistake}
              </li>
              <li>
                <strong>Kiểm chứng/sửa:</strong> {lesson.reflectionVerify}
              </li>
            </ul>
            {canPrecheck ? <SpotCheckForm lessonProgressId={lesson.id} /> : null}
          </div>
        ))}
      </section>

      {detail.history.length ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Lịch sử</h2>
          {detail.history.map((h) => (
            <p key={h.id} className="text-sm">
              {dateFormat.format(h.createdAt)} · {h.label} (v{h.version}){h.comment ? `: ${h.comment}` : ""}
            </p>
          ))}
        </section>
      ) : null}

      {waiting && canReview ? (
        <section className="flex flex-col gap-3 rounded-xl border border-primary/40 p-4">
          <h2 className="text-lg font-semibold">Chấm</h2>
          <ReviewForm reportId={detail.report.id} criteria={detail.criteria} templates={[...(MODULE_TEMPLATES[detail.report.moduleId] ?? []), ...COMMON_TEMPLATES]} />
        </section>
      ) : null}
      {detail.report.status === "submitted" && canPrecheck && !canReview ? (
        <section className="flex flex-col gap-3 rounded-xl border border-primary/40 p-4">
          <h2 className="text-lg font-semibold">Kiểm hồ sơ</h2>
          <PrecheckForm reportId={detail.report.id} />
        </section>
      ) : null}
    </main>
  );
}
