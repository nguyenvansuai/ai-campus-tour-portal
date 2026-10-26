"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ModuleId } from "@/modules/curriculum/types";
import { startQuizAction, submitQuizAction } from "../actions";

type Quiz = Extract<Awaited<ReturnType<typeof startQuizAction>>, { ok: true }>["quiz"];
type Result = Extract<Awaited<ReturnType<typeof submitQuizAction>>, { ok: true }>["result"];

export function QuizRunner({ moduleId, alreadyPassed }: { moduleId: ModuleId; alreadyPassed: boolean }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function start() {
    setPending(true);
    setError(null);
    const response = await startQuizAction(moduleId);
    setPending(false);
    if (!response.ok) return setError(response.message);
    setQuiz(response.quiz);
    setAnswers({});
    setResult(null);
  }

  async function submit() {
    if (!quiz) return;
    if (Object.keys(answers).length < quiz.questions.length && !confirm("Bạn chưa trả lời hết. Vẫn nộp bài?")) return;
    setPending(true);
    const response = await submitQuizAction(quiz.attemptId, answers);
    setPending(false);
    if (!response.ok) return setError(response.message);
    setResult(response.result);
    setQuiz(null);
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className={result.passed ? "text-lg font-semibold text-green-700" : "text-lg font-semibold text-destructive"}>
          {result.passed ? "Đạt" : "Chưa đạt"}: {result.correct}/{result.total} câu đúng ({result.score}%)
        </p>
        <ol className="flex flex-col gap-4">
          {result.review.map((q, i) => (
            <li key={q.id} className="flex flex-col gap-1 rounded-lg border border-border p-3">
              <p className="font-medium">
                {i + 1}. {q.question}
              </p>
              <p className={q.chosen === q.answer ? "text-green-700" : "text-destructive"}>
                {q.chosen === q.answer ? "✓ Đúng" : `✗ Bạn chọn: ${q.chosen === null ? "(bỏ trống)" : q.options[q.chosen]}`}
              </p>
              {q.chosen !== q.answer ? <p>Đáp án: {q.options[q.answer]}</p> : null}
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
            </li>
          ))}
        </ol>
        {!result.passed ? <p className="text-sm">Ôn lại các buổi trong module rồi làm lại sau 30 phút.</p> : null}
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col gap-3">
        {alreadyPassed ? <p className="text-green-700">Bạn đã đạt trắc nghiệm này.</p> : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button onClick={start} disabled={pending}>
          {pending ? "Đang chuẩn bị…" : alreadyPassed ? "Làm lại để ôn tập" : "Bắt đầu làm bài"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">Cần đúng từ {quiz.passPercent}% để đạt.</p>
      {quiz.questions.map((q, i) => (
        <fieldset key={q.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <legend className="px-1 font-medium">
            {i + 1}. {q.question}
          </legend>
          {q.options.map((option) => (
            <label key={option.index} className="flex items-start gap-3 rounded-md p-2 has-checked:bg-primary/10">
              <input
                type="radio"
                name={q.id}
                className="mt-1 size-5"
                checked={answers[q.id] === option.index}
                onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: option.index }))}
              />
              <span>{option.text}</span>
            </label>
          ))}
        </fieldset>
      ))}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button onClick={submit} disabled={pending}>
        {pending ? "Đang chấm…" : "Nộp bài"}
      </Button>
    </div>
  );
}
