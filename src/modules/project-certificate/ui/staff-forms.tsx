"use client";

import { useActionState, useState } from "react";
import { idleState, type FormState } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { EXCELLENT_SCORE, FINAL_RUBRIC, PASS_SCORE } from "@/modules/curriculum/content/program";
import { approveCertificatesAction, revokeCertificateAction, scoreFinalAction } from "../actions";

function Status({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p role="status" className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-green-700"}>
      {state.message}
    </p>
  );
}

export function ScoreForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(scoreFinalAction, idleState);
  const [scores, setScores] = useState<Record<string, number>>({});
  const total = FINAL_RUBRIC.reduce((sum, r) => sum + (scores[r.key] ?? 0), 0);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />
      {FINAL_RUBRIC.map((r) => (
        <div key={r.key} className="flex items-center justify-between gap-3">
          <label htmlFor={`score_${r.key}`} className="text-sm">
            {r.label} <span className="text-muted-foreground">(tối đa {r.max})</span>
          </label>
          <input
            id={`score_${r.key}`}
            name={`score_${r.key}`}
            type="number"
            min={0}
            max={r.max}
            required
            inputMode="numeric"
            className="h-11 w-20 rounded-lg border border-border bg-background px-3 text-base"
            onChange={(e) => setScores((s) => ({ ...s, [r.key]: Number(e.target.value) || 0 }))}
          />
        </div>
      ))}
      <p className="font-medium">
        Tổng: {total}/100 ·{" "}
        {total >= EXCELLENT_SCORE ? "≥ 90: sẽ cần mentor thứ hai chấm độc lập" : total >= PASS_SCORE ? "Đạt" : "Cần sửa (SV được nộp lại 1 lần)"}
      </p>
      <label htmlFor="comment" className="font-medium">
        Nhận xét (bắt buộc khi dưới {PASS_SCORE})
      </label>
      <textarea id="comment" name="comment" className="min-h-28 w-full rounded-lg border border-border bg-background p-3 text-base" />
      <Status state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : "Lưu điểm"}
      </Button>
    </form>
  );
}

type Candidate = { enrollmentId: string; studentName: string; studentEmail: string; schoolName: string; projectTitle: string; score: number; requiresSchool: boolean; schoolApproved: boolean; instituteApproved: boolean };

export function ApproveForm({ as, candidates }: { as: "school" | "institute"; candidates: Candidate[] }) {
  const [state, action, pending] = useActionState(approveCertificatesAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-3" onSubmit={(e) => !confirm("Duyệt chứng nhận cho các SV đã chọn?") && e.preventDefault()}>
      <input type="hidden" name="as" value={as} />
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {candidates.map((c) => (
          <li key={c.enrollmentId}>
            <label className="flex items-start gap-3 p-3">
              <input type="checkbox" name="enrollmentId" value={c.enrollmentId} defaultChecked className="mt-1 size-5 shrink-0" />
              <span className="flex flex-col">
                <span className="font-medium">
                  {c.studentName || c.studentEmail} · {c.score} điểm
                </span>
                <span className="text-sm text-muted-foreground">
                  {c.schoolName} · {c.projectTitle}
                </span>
                <span className="text-xs text-muted-foreground">
                  {c.requiresSchool ? `Trường: ${c.schoolApproved ? "đã duyệt" : "chưa duyệt"} · ` : "Chỉ Viện cấp · "}Viện: {c.instituteApproved ? "đã duyệt" : "chưa duyệt"}
                </span>
              </span>
            </label>
          </li>
        ))}
        {candidates.length === 0 ? <li className="p-3 text-muted-foreground">Không có SV nào chờ duyệt.</li> : null}
      </ul>
      <Status state={state} />
      <Button type="submit" disabled={pending || candidates.length === 0}>
        {pending ? "Đang duyệt…" : `Duyệt các SV đã chọn (${as === "school" ? "Trường" : "Viện"})`}
      </Button>
    </form>
  );
}

export function RevokeForm({ certificateId }: { certificateId: string }) {
  const [state, action, pending] = useActionState(revokeCertificateAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => !confirm("Thu hồi chứng nhận này?") && e.preventDefault()}>
      <input type="hidden" name="certificateId" value={certificateId} />
      <input name="reason" required aria-label="Lý do thu hồi" placeholder="Lý do thu hồi" className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm" />
      <Button type="submit" variant="outline" className="h-10 px-3 text-sm text-destructive" disabled={pending}>
        Thu hồi
      </Button>
      <Status state={state} />
    </form>
  );
}
