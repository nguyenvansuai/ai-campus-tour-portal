"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EvidenceField } from "@/modules/curriculum/types";
import { completeLessonAction, type LessonFormState } from "../actions";

type Existing = { values: Record<string, string>; reflectionMistake: string; reflectionVerify: string; sourceCodes: string[] } | null;

const textareaClass = "min-h-28 w-full rounded-lg border border-border bg-background p-3 text-base";
const initial: LessonFormState = { status: "idle", message: "" };

export function LessonForm({
  lessonNumber,
  fields,
  sources,
  existing,
  disabled,
}: {
  lessonNumber: number;
  fields: EvidenceField[];
  sources: { code: string; title: string }[];
  existing: Existing;
  disabled?: string;
}) {
  const [state, action, pending] = useActionState(completeLessonAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="lessonNumber" value={lessonNumber} />
      {fields.map((field) => {
        const id = `ev_${field.key}`;
        const defaultValue = existing?.values[field.key] ?? "";
        return (
          <div key={field.key} className="flex flex-col gap-2">
            <Label htmlFor={id}>{field.label}</Label>
            {field.type === "textarea" ? (
              <textarea id={id} name={id} className={textareaClass} defaultValue={defaultValue} placeholder={field.placeholder} required />
            ) : field.type === "file" ? (
              <>
                <Input id={id} name={id} type="file" accept={field.accept} required={!defaultValue} className="py-2" />
                {defaultValue ? <p className="text-xs text-muted-foreground">Đã nộp: {defaultValue}. Chọn file mới nếu muốn thay.</p> : null}
              </>
            ) : field.type === "number" ? (
              <div className="flex items-center gap-2">
                <Input id={id} name={id} type="number" min={0} inputMode="numeric" defaultValue={defaultValue} required />
                <span className="text-sm">{field.unit}</span>
              </div>
            ) : (
              <Input id={id} name={id} type={field.type === "link" ? "url" : "text"} defaultValue={defaultValue} placeholder={field.placeholder} required />
            )}
          </div>
        );
      })}
      <div className="flex flex-col gap-2">
        <Label htmlFor="reflectionMistake">AI đã sai hoặc thiếu ở đâu trong buổi này?</Label>
        <textarea id="reflectionMistake" name="reflectionMistake" className={textareaClass} defaultValue={existing?.reflectionMistake} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="reflectionVerify">Bạn đã kiểm chứng hoặc sửa thế nào?</Label>
        <textarea id="reflectionVerify" name="reflectionVerify" className={textareaClass} defaultValue={existing?.reflectionVerify} required />
      </div>
      {sources.length ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Bạn đã học từ nguồn nào? (không bắt buộc)</legend>
          {sources.map((source) => (
            <label key={source.code} className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="sources" value={source.code} defaultChecked={existing?.sourceCodes.includes(source.code)} className="mt-0.5 size-5" />
              <span>
                {source.code} – {source.title}
              </span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {state.message ? (
        <p role="status" className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-green-700"}>
          {state.message}
        </p>
      ) : null}
      {disabled ? <p className="text-sm text-muted-foreground">{disabled}</p> : null}
      <Button type="submit" disabled={pending || Boolean(disabled)}>
        {pending ? "Đang nộp…" : existing ? "Cập nhật minh chứng" : "Nộp minh chứng và hoàn thành buổi"}
      </Button>
    </form>
  );
}
