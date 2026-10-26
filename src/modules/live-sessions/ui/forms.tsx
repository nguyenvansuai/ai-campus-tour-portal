"use client";

import { ActionForm } from "@/components/form/action-form";
import { TextField } from "@/components/form/field";
import { cancelSessionAction, createSessionsAction } from "../actions";

export function CreateSessionForm() {
  return (
    <ActionForm action={createSessionsAction} submitLabel="Tạo buổi hỗ trợ">
      <TextField id="title" name="title" label="Tiêu đề" required defaultValue="Giờ hỗ trợ: hỏi đáp bài tập" />
      <TextField id="startsAt" name="startsAt" label="Bắt đầu (giờ Việt Nam)" type="datetime-local" required />
      <TextField id="durationMinutes" name="durationMinutes" label="Thời lượng (phút)" type="number" min={30} max={180} defaultValue={60} required />
      <TextField id="repeatWeeks" name="repeatWeeks" label="Lặp hằng tuần (số buổi, tối đa 8)" type="number" min={1} max={8} defaultValue={1} />
      <TextField id="note" name="note" label="Ghi chú cho SV (tùy chọn)" />
    </ActionForm>
  );
}

export function CancelSessionForm({ sessionId }: { sessionId: string }) {
  return (
    <ActionForm action={cancelSessionAction} submitLabel="Hủy buổi" variant="outline" confirmMessage="Hủy buổi hỗ trợ này?">
      <input type="hidden" name="sessionId" value={sessionId} />
    </ActionForm>
  );
}
