"use client";

import { useActionState } from "react";
import { idleState } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SELF_ASSESSMENT } from "@/modules/curriculum/content/program";
import { submitFinalAction } from "../actions";
import { FINAL_FIELDS } from "../fields";

const inputClass = "w-full rounded-lg border border-border bg-background p-3 text-base";

export function FinalForm({ draft, start, canSubmit, blockedReason }: { draft: Record<string, string>; start: Record<string, number>; canSubmit: boolean; blockedReason?: string }) {
  const [state, action, pending] = useActionState(submitFinalAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-5">
      {FINAL_FIELDS.map((field) => (
        <div key={field.key} className="flex flex-col gap-2">
          <Label htmlFor={`ff_${field.key}`}>{field.label}</Label>
          <p className="text-sm text-muted-foreground">{field.hint}</p>
          {field.type === "textarea" ? (
            <textarea id={`ff_${field.key}`} name={`ff_${field.key}`} defaultValue={draft[field.key] ?? ""} className={`${inputClass} min-h-28`} required minLength={field.minLength} />
          ) : (
            <input
              id={`ff_${field.key}`}
              name={`ff_${field.key}`}
              type={field.type === "link" ? "url" : "text"}
              defaultValue={draft[field.key] ?? ""}
              className={`${inputClass} h-12`}
              required
              placeholder={field.type === "link" ? "https://" : undefined}
            />
          )}
        </div>
      ))}

      <div className="flex flex-col gap-2">
        <Label htmlFor="pdf">File PDF mô tả dự án (bắt buộc, tối đa 10 MB)</Label>
        <p className="text-sm text-muted-foreground">1–3 trang: đề bài, ảnh chụp sản phẩm, kết quả kiểm thử, số đo trước/sau. Đây là bằng chứng cố định nếu link dự án thay đổi.</p>
        <input id="pdf" name="pdf" type="file" accept="application/pdf" required className="text-base" />
      </div>

      <fieldset className="flex flex-col gap-4 rounded-xl border border-border p-4">
        <legend className="px-1 font-semibold">Tự đánh giá cuối khóa (1 = chưa biết, 5 = thành thạo)</legend>
        {SELF_ASSESSMENT.map((q) => (
          <div key={q.key} className="flex flex-col gap-2" role="radiogroup" aria-label={q.label}>
            <span className="text-sm">
              {q.label}
              {start[q.key] ? <span className="text-muted-foreground"> · đầu khóa: {start[q.key]}</span> : null}
            </span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <label key={score} className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-border py-2 has-checked:border-primary has-checked:bg-primary/10">
                  <input type="radio" name={`sa_${q.key}`} value={score} required className="sr-only" />
                  {score}
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>

      <label className="flex items-start gap-3">
        <input type="checkbox" name="showProjectLink" defaultChecked className="mt-1 size-5 shrink-0" />
        <span>Cho phép hiện link dự án trên trang xác thực chứng nhận công khai</span>
      </label>

      {state.message ? (
        <p role="status" className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-green-700"}>
          {state.message}
        </p>
      ) : null}
      {!canSubmit && blockedReason ? <p className="text-sm text-muted-foreground">{blockedReason}</p> : null}
      <Button type="submit" disabled={pending || !canSubmit}>
        {pending ? "Đang nộp…" : "Nộp dự án cuối"}
      </Button>
    </form>
  );
}
