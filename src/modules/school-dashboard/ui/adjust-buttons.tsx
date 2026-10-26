"use client";

import { ActionForm } from "@/components/form/action-form";
import { adjustEnrollmentAction } from "@/modules/enrollment/staff-actions";

export function AdjustButtons({ enrollmentId, paused, extended }: { enrollmentId: string; paused: boolean; extended: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {!extended ? (
        <ActionForm action={adjustEnrollmentAction} submitLabel="Gia hạn +7 ngày" variant="outline" confirmMessage="Gia hạn 7 ngày cho SV này? Mỗi SV chỉ được gia hạn 1 lần.">
          <input type="hidden" name="enrollmentId" value={enrollmentId} />
          <input type="hidden" name="op" value="extend" />
        </ActionForm>
      ) : null}
      <ActionForm action={adjustEnrollmentAction} submitLabel={paused ? "Tiếp tục lộ trình" : "Bảo lưu"} variant="outline">
        <input type="hidden" name="enrollmentId" value={enrollmentId} />
        <input type="hidden" name="op" value={paused ? "resume" : "pause"} />
      </ActionForm>
    </div>
  );
}
