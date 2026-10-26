import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ModuleId } from "@/modules/curriculum/types";
import { getOpenEnrollment } from "@/modules/enrollment/service";
import { requireSession } from "@/modules/identity/session";
import { getProgress, quizFor } from "@/modules/learning/service";
import { QuizRunner } from "@/modules/learning/ui/quiz-runner";

export const metadata: Metadata = { title: "Trắc nghiệm · AI Campus Tour" };

export default async function QuizPage({ params }: PageProps<"/hoc/trac-nghiem/[module]">) {
  const { user } = await requireSession();
  const row = await getOpenEnrollment(user.id);
  if (!row) redirect("/bat-dau");
  const moduleId = (await params).module as ModuleId;
  const bank = quizFor(row, moduleId);
  if (!bank) notFound();
  const progress = await getProgress(row.id);
  if (!progress.unlocked[moduleId]) redirect("/hoc");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/hoc" className="text-sm text-primary">
        ← Lộ trình
      </Link>
      <h1 className="text-2xl font-bold">{bank.title}</h1>
      <p className="text-muted-foreground">
        {bank.drawCount} câu rút ngẫu nhiên. Đạt từ {bank.passPercent}%. Làm lại được sau 30 phút, tối đa 3 lần mỗi ngày.
      </p>
      <QuizRunner moduleId={moduleId} alreadyPassed={progress.passedQuizzes.has(bank.id)} />
    </main>
  );
}
