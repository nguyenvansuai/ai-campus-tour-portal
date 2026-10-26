import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { findResource } from "@/modules/curriculum/content/catalog";
import { lessonByNumber, lessonContentFor } from "@/modules/curriculum/content/program";
import type { Track } from "@/modules/curriculum/types";
import { getOpenEnrollment } from "@/modules/enrollment/service";
import { requireSession } from "@/modules/identity/session";
import type { EvidenceValue } from "@/modules/learning/schema";
import { getProgress } from "@/modules/learning/service";
import { CopyButton } from "@/modules/learning/ui/copy-button";
import { LessonForm } from "@/modules/learning/ui/lesson-form";
import { ResourceCard } from "@/modules/learning/ui/resource-card";
import { RichText } from "@/modules/learning/ui/rich-text";

export const metadata: Metadata = { title: "Buổi học · AI Campus Tour" };

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function evidenceText(value: EvidenceValue | undefined) {
  if (value === undefined) return "";
  return typeof value === "object" ? value.name : String(value);
}

export default async function LessonPage({ params }: PageProps<"/hoc/buoi/[so]">) {
  const { user } = await requireSession();
  const row = await getOpenEnrollment(user.id);
  if (!row) redirect("/bat-dau");
  const lesson = lessonByNumber(Number((await params).so));
  if (!lesson) notFound();
  const progress = await getProgress(row.id);
  if (!progress.unlocked[lesson.moduleId]) redirect("/hoc");

  const content = lessonContentFor(lesson, row.track as Track);
  const existing = progress.lessons.find((l) => l.lessonNumber === lesson.number);
  const resources = content.resources.flatMap((ref) => {
    const resource = findResource(ref.code);
    return resource ? [{ resource, ref }] : [];
  });
  const reportPassed = progress.reports.get(lesson.moduleId as "M1")?.status === "passed";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-6 leading-7">
      <div className="flex flex-col gap-2">
        <Link href="/hoc" className="text-sm text-primary">
          ← Lộ trình
        </Link>
        <p className="text-sm text-muted-foreground">
          {lesson.moduleId} · Buổi {lesson.number} · ~{lesson.minutes} phút
        </p>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        {existing ? <p className="text-sm text-green-700">✓ Bạn đã hoàn thành buổi này</p> : null}
      </div>

      <Block title="Mục tiêu">
        <p>{content.goal}</p>
        <p className="text-muted-foreground">{content.why}</p>
      </Block>

      <Block title="Kiến thức cốt lõi">
        <ul className="list-disc space-y-2 pl-5">
          {content.keyIdeas.map((idea, i) => (
            <li key={i}>
              <RichText text={idea} />
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Học ở đâu (chọn 1 nguồn là đủ)">
        <ul className="flex flex-col gap-3">
          {resources.map(({ resource, ref }) => (
            <ResourceCard key={ref.code} resource={resource} reference={ref} />
          ))}
          {resources.length === 0 ? <p className="text-muted-foreground">Buổi này không cần học thêm nguồn ngoài, làm theo các bước bên dưới.</p> : null}
        </ul>
        {content.freePath ? (
          <p className="rounded-lg bg-green-700/10 p-3 text-sm">
            <strong>Không có công cụ trả phí?</strong> {content.freePath}
          </p>
        ) : null}
      </Block>

      <Block title="Các bước tự làm">
        <ol className="flex flex-col gap-3">
          {content.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i + 1}</span>
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Block>

      <Block title="Prompt mẫu">
        {content.prompts.map((prompt) => (
          <div key={prompt.title} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <p className="font-medium">{prompt.title}</p>
            <pre className="whitespace-pre-wrap rounded bg-foreground/5 p-3 font-sans text-sm">{prompt.text}</pre>
            <CopyButton text={prompt.text} />
          </div>
        ))}
      </Block>

      <Block title="Bài đạt chuẩn trông như thế nào">
        <p className="rounded-lg border-l-4 border-primary bg-primary/5 p-3">{content.example}</p>
      </Block>

      <Block title="Lỗi hay gặp">
        <ul className="list-disc space-y-1 pl-5">
          {content.commonMistakes.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </Block>

      <Block title="Tự kiểm tra trước khi nộp">
        <ul className="space-y-1">
          {content.selfCheck.map((c, i) => (
            <li key={i}>☐ {c}</li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">Lưu ý an toàn: không đưa dữ liệu cá nhân, dữ liệu công ty/trường vào AI; che thông tin cá nhân trong ảnh chụp.</p>
      </Block>

      <Block title="Nộp minh chứng">
        <LessonForm
          lessonNumber={lesson.number}
          fields={content.evidence}
          sources={resources.map(({ resource }) => ({ code: resource.code, title: resource.title }))}
          existing={
            existing
              ? {
                  values: Object.fromEntries(content.evidence.map((f) => [f.key, evidenceText(existing.evidence[f.key])])),
                  reflectionMistake: existing.reflectionMistake,
                  reflectionVerify: existing.reflectionVerify,
                  sourceCodes: existing.sourceCodes,
                }
              : null
          }
          disabled={reportPassed ? "Báo cáo module đã Đạt nên không sửa minh chứng nữa." : undefined}
        />
      </Block>
    </main>
  );
}
