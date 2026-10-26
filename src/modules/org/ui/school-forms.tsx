"use client";

import { ActionForm } from "@/components/form/action-form";
import { CheckboxField, SelectField, TextField } from "@/components/form/field";
import {
  createClassAction,
  createCodeAction,
  createEventAction,
  createFacultyAction,
  createSchoolAction,
  mergeSchoolAction,
  updateSchoolAction,
} from "../actions";

export function CreateSchoolForm() {
  return (
    <ActionForm action={createSchoolAction} submitLabel="Thêm trường" className="max-w-md">
      <TextField id="name" name="name" label="Tên trường" required />
      <TextField id="shortName" name="shortName" label="Tên viết tắt (không bắt buộc)" />
      <CheckboxField id="connected" name="connected" label="Đã kết nối (chứng nhận có tên trường)" />
    </ActionForm>
  );
}

type SchoolLite = { id: string; name: string; shortName: string | null; connected: boolean; status: "verified" | "pending" };

export function EditSchoolForm({ school }: { school: SchoolLite }) {
  return (
    <ActionForm action={updateSchoolAction} submitLabel="Lưu" className="max-w-md">
      <input type="hidden" name="schoolId" value={school.id} />
      <TextField id="name" name="name" label="Tên trường" defaultValue={school.name} required />
      <TextField id="shortName" name="shortName" label="Tên viết tắt" defaultValue={school.shortName ?? ""} />
      <CheckboxField id="connected" name="connected" label="Đã kết nối (chứng nhận có tên trường)" defaultChecked={school.connected} />
      <CheckboxField id="verified" name="verified" label="Đã xác minh (hiện trong danh sách cho SV chọn)" defaultChecked={school.status === "verified"} />
    </ActionForm>
  );
}

export function AddFacultyForm({ schoolId }: { schoolId: string }) {
  return (
    <ActionForm action={createFacultyAction} submitLabel="Thêm khoa" variant="outline">
      <input type="hidden" name="schoolId" value={schoolId} />
      <TextField id="faculty-name" name="name" label="Tên khoa" required />
    </ActionForm>
  );
}

export function AddClassForm({ facultyId }: { facultyId: string }) {
  return (
    <ActionForm action={createClassAction} submitLabel="Thêm lớp" variant="outline" className="sm:flex-row sm:items-end">
      <input type="hidden" name="facultyId" value={facultyId} />
      <TextField id={`class-${facultyId}`} name="name" label="Tên lớp" required />
    </ActionForm>
  );
}

export function MergeSchoolForm({ removeId, candidates }: { removeId: string; candidates: { id: string; name: string }[] }) {
  return (
    <ActionForm
      action={mergeSchoolAction}
      submitLabel="Gộp vào trường đã chọn"
      variant="outline"
      confirmMessage="Gộp trường này vào trường đã chọn? Trường này sẽ bị xóa sau khi chuyển dữ liệu."
      className="max-w-md"
    >
      <input type="hidden" name="removeId" value={removeId} />
      <SelectField id="keepId" name="keepId" label="Gộp vào trường" required defaultValue="">
        <option value="" disabled>
          Chọn trường giữ lại
        </option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectField>
    </ActionForm>
  );
}

export function CreateEventForm({ schools }: { schools: { id: string; name: string }[] }) {
  return (
    <ActionForm action={createEventAction} submitLabel="Tạo sự kiện" className="max-w-md">
      <SelectField id="schoolId" name="schoolId" label="Trường đăng cai" required defaultValue="">
        <option value="" disabled>
          Chọn trường
        </option>
        {schools.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </SelectField>
      <TextField id="event-name" name="name" label="Tên sự kiện" placeholder="Workshop AI Campus Tour – ĐH Công Thương" required />
      <TextField id="heldOn" name="heldOn" type="date" label="Ngày tổ chức" required />
    </ActionForm>
  );
}

export function CreateCodeForm({ eventId }: { eventId: string }) {
  return (
    <ActionForm action={createCodeAction} submitLabel="Tạo mã kích hoạt" variant="outline" className="sm:flex-row sm:items-end">
      <input type="hidden" name="eventId" value={eventId} />
      <TextField id={`maxUses-${eventId}`} name="maxUses" type="number" min={1} max={5000} defaultValue={600} label="Số lượt tối đa" required />
      <TextField id={`validDays-${eventId}`} name="validDays" type="number" min={1} max={365} defaultValue={3} label="Hiệu lực (ngày)" required />
    </ActionForm>
  );
}
