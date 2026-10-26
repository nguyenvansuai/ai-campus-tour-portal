"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { REPORT_FIELDS } from "@/modules/curriculum/content/program";
import { submitReportAction, type LessonFormState } from "../actions";

const initial: LessonFormState = { status: "idle", message: "" };

export function ReportForm({ moduleId, draft, canSubmit, blockedReason }: { moduleId: string; draft: Record<string, string>; canSubmit: boolean; blockedReason?: string }) {
  const [state, action, pending] = useActionState(submitReportAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="moduleId" value={moduleId} />
      {REPORT_FIELDS.map((field) => (
        <div key={field.key} className="flex flex-col gap-2">
          <Label htmlFor={`rf_${field.key}`}>{field.label}</Label>
          <textarea
            id={`rf_${field.key}`}
            name={`rf_${field.key}`}
            defaultValue={draft[field.key] ?? ""}
            className={`w-full rounded-lg border border-border bg-background p-3 text-base ${field.key === "hours" ? "min-h-12" : "min-h-32"}`}
            required={field.key !== "difficulties"}
          />
        </div>
      ))}
      {state.message ? (
        <p role="status" className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-green-700"}>
          {state.message}
        </p>
      ) : null}
      {!canSubmit && blockedReason ? <p className="text-sm text-muted-foreground">{blockedReason}</p> : null}
      <Button type="submit" disabled={pending || !canSubmit}>
        {pending ? "Đang nộp…" : "Nộp báo cáo"}
      </Button>
    </form>
  );
}
