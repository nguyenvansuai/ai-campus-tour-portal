"use client";

import { useActionState } from "react";
import { idleState, type FormState } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { claimVoucherAction, importVouchersAction, recordManualAction, revokeCreditAction } from "../actions";

const textareaClass = "min-h-28 w-full rounded-lg border border-border bg-background p-3 text-base";

function Status({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p role="status" className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-green-700"}>
      {state.message}
    </p>
  );
}

export function ManualCreditForm() {
  const [state, action, pending] = useActionState(recordManualAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="emails" className="font-medium">
        Email SV đã học lớp trên meet.suai.vn (mỗi dòng 1 email)
      </label>
      <textarea id="emails" name="emails" required className={textareaClass} />
      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium">Đã học đủ chủ đề của module</legend>
        {[
          ["M1", "M1 – chủ đề 1–11"],
          ["M2", "M2 – chủ đề 12–15"],
          ["M3", "M3 – chủ đề 16–25 (chỉ miễn cho khối A/B)"],
        ].map(([value, label]) => (
          <label key={value} className="flex items-center gap-3">
            <input type="checkbox" name="modules" value={value} defaultChecked className="size-5" />
            {label}
          </label>
        ))}
      </fieldset>
      <input name="note" aria-label="Ghi chú" placeholder="Ghi chú (vd. lớp tối 3-5 tháng 10)" className="h-11 rounded-lg border border-border bg-background px-3" />
      <Status state={state} />
      <Button type="submit" disabled={pending}>
        Ghi nhận
      </Button>
    </form>
  );
}

export function RevokeCreditForm({ creditId }: { creditId: string }) {
  const [state, action, pending] = useActionState(revokeCreditAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="creditId" value={creditId} />
      <input name="reason" required aria-label="Lý do thu hồi" placeholder="Lý do thu hồi" className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm" />
      <Button type="submit" variant="outline" className="h-9 px-3 text-sm" disabled={pending}>
        Thu hồi
      </Button>
      <Status state={state} />
    </form>
  );
}

export function ImportVouchersForm() {
  const [state, action, pending] = useActionState(importVouchersAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="kind" className="font-medium">
        Loại mã
      </label>
      <select id="kind" name="kind" className="h-11 rounded-lg border border-border bg-background px-3">
        <option value="free_seat">Suất học miễn phí khóa video</option>
        <option value="discount">Mã giảm 50%</option>
      </select>
      <label htmlFor="codes" className="font-medium">
        Mã (mỗi dòng 1 mã, tạo sẵn trên suai.vn, mỗi mã dùng 1 lần)
      </label>
      <textarea id="codes" name="codes" required className={textareaClass} />
      <Status state={state} />
      <Button type="submit" disabled={pending}>
        Thêm mã
      </Button>
    </form>
  );
}

export function ClaimVoucherForm({ kind, label }: { kind: "free_seat" | "discount"; label: string }) {
  const [state, action, pending] = useActionState(claimVoucherAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="kind" value={kind} />
      <Button type="submit" variant="outline" disabled={pending}>
        {label}
      </Button>
      <Status state={state} />
    </form>
  );
}
