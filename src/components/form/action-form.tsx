"use client";

import { useActionState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FormState = { status: "idle" | "success" | "error"; message: string };
export const idleState: FormState = { status: "idle", message: "" };

type ActionFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children?: ReactNode;
  className?: string;
  confirmMessage?: string;
  variant?: "default" | "outline" | "link";
};

/** Form gọi server action, hiện thông báo kết quả ngay dưới nút. */
export function ActionForm({ action, submitLabel, children, className, confirmMessage, variant = "default" }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, idleState);
  return (
    <form
      action={formAction}
      className={cn("flex flex-col gap-3", className)}
      onSubmit={(event) => {
        if (confirmMessage && !confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {children}
      <Button type="submit" variant={variant} disabled={pending}>
        {pending ? "Đang xử lý…" : submitLabel}
      </Button>
      {state.message ? (
        <p role="status" className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-green-700"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
