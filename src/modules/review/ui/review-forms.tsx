"use client";

import { useActionState, useRef } from "react";
import { idleState } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { precheckAction, reviewAction, spotCheckAction } from "../actions";

const textareaClass = "min-h-28 w-full rounded-lg border border-border bg-background p-3 text-base";

function Status({ state }: { state: { status: string; message: string } }) {
  if (!state.message) return null;
  return (
    <p role="status" className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-green-700"}>
      {state.message}
    </p>
  );
}

export function ReviewForm({ reportId, criteria, templates }: { reportId: string; criteria: string[]; templates: string[] }) {
  const [state, action, pending] = useActionState(reviewAction, idleState);
  const comment = useRef<HTMLTextAreaElement>(null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="criteriaCount" value={criteria.length} />
      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium">Tiêu chí Đạt (tick tiêu chí đã đạt)</legend>
        {criteria.map((c, i) => (
          <label key={c} className="flex items-start gap-3">
            <input type="checkbox" name={`criterion_${i}`} className="mt-1 size-5" />
            <span>{c}</span>
          </label>
        ))}
      </fieldset>
      <div className="flex flex-col gap-2">
        <label htmlFor="comment" className="font-medium">
          Nhận xét (bắt buộc khi Cần sửa)
        </label>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t}
              type="button"
              className="rounded-full border border-border px-3 py-1 text-left text-xs hover:bg-foreground/5"
              onClick={() => {
                if (comment.current) comment.current.value = `${comment.current.value}${comment.current.value ? "\n" : ""}${t}`;
              }}
            >
              {t.length > 60 ? `${t.slice(0, 60)}…` : t}
            </button>
          ))}
        </div>
        <textarea id="comment" name="comment" ref={comment} className={textareaClass} />
      </div>
      <Status state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : "Lưu kết quả chấm"}
      </Button>
    </form>
  );
}

export function PrecheckForm({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState(precheckAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="reportId" value={reportId} />
      <textarea name="comment" aria-label="Ghi chú cho SV (bắt buộc khi trả lại)" placeholder="Thiếu gì? (bắt buộc khi trả lại)" className={textareaClass} />
      <Status state={state} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" name="decision" value="ok" disabled={pending}>
          Đủ hồ sơ – chuyển mentor
        </Button>
        <Button type="submit" name="decision" value="return" variant="outline" disabled={pending}>
          Trả lại – thiếu hồ sơ
        </Button>
      </div>
    </form>
  );
}

export function SpotCheckForm({ lessonProgressId }: { lessonProgressId: string }) {
  const [state, action, pending] = useActionState(spotCheckAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="lessonProgressId" value={lessonProgressId} />
      <input name="note" aria-label="Lý do (khi không hợp lệ)" placeholder="Lý do nếu không hợp lệ" className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
      <div className="flex gap-2">
        <Button type="submit" name="decision" value="ok" variant="outline" className="h-9 px-3 text-sm" disabled={pending}>
          Hợp lệ
        </Button>
        <Button type="submit" name="decision" value="bad" variant="outline" className="h-9 px-3 text-sm text-destructive" disabled={pending}>
          Không hợp lệ
        </Button>
      </div>
      <Status state={state} />
    </form>
  );
}
