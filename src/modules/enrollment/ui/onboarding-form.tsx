"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CheckboxField, SelectField, TextField } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { SELF_ASSESSMENT, TOOL_OPTIONS } from "@/modules/curriculum/content/program";
import { TRACK_LABELS, type Track } from "@/modules/curriculum/types";
import { CONSENT_LABELS } from "@/modules/identity/consent-labels";
import { CONSENT_KEYS, REQUIRED_CONSENTS } from "@/modules/identity/consent-keys";
import { enrollAction, type EnrollState } from "../actions";

type SchoolOption = { id: string; name: string; faculties: { id: string; name: string }[] };

export type OnboardingFormProps = {
  defaultName: string;
  schools: SchoolOption[];
  code?: { code: string; schoolId: string; eventName: string } | null;
  codeInvalid?: boolean;
};

const initial: EnrollState = { message: "" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <legend className="px-1 text-lg font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

export function OnboardingForm({ defaultName, schools, code, codeInvalid }: OnboardingFormProps) {
  const [state, action, pending] = useActionState(enrollAction, initial);
  const [schoolId, setSchoolId] = useState(code?.schoolId ?? "");
  const [facultyId, setFacultyId] = useState("");
  const faculties = schools.find((s) => s.id === schoolId)?.faculties ?? [];

  return (
    <form action={action} className="flex flex-col gap-6">
      {code ? (
        <p className="rounded-lg bg-green-700/10 p-3 text-sm">
          Mã workshop <span className="font-mono font-semibold">{code.code}</span> – {code.eventName}
        </p>
      ) : null}
      {codeInvalid ? (
        <p className="rounded-lg bg-amber-500/10 p-3 text-sm">Mã workshop không hợp lệ hoặc đã hết hạn. Bạn vẫn đăng ký bình thường được.</p>
      ) : null}
      <input type="hidden" name="activationCode" value={code?.code ?? ""} />

      <Section title="1. Thông tin của bạn">
        <TextField id="name" name="name" label="Họ và tên" defaultValue={defaultName} autoComplete="name" required />
        <TextField id="phone" name="phone" label="Số điện thoại (không bắt buộc, cần nếu muốn nhận Zalo)" inputMode="tel" autoComplete="tel" />
        <TextField id="studentCode" name="studentCode" label="Mã số sinh viên (không bắt buộc)" />
      </Section>

      <Section title="2. Trường của bạn">
        <SelectField
          id="schoolId"
          name="schoolId"
          label="Trường"
          value={schoolId}
          onChange={(event) => {
            setSchoolId(event.target.value);
            setFacultyId("");
          }}
          required
        >
          <option value="" disabled>
            Chọn trường
          </option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          <option value="other">Trường của tôi chưa có trong danh sách</option>
        </SelectField>
        {schoolId === "other" ? <TextField id="newSchoolName" name="newSchoolName" label="Tên trường của bạn" required /> : null}
        {schoolId && schoolId !== "other" && faculties.length > 0 ? (
          <SelectField id="facultyId" name="facultyId" label="Khoa" value={facultyId} onChange={(event) => setFacultyId(event.target.value)} required>
            <option value="" disabled>
              Chọn khoa
            </option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
            <option value="other">Khoa của tôi chưa có</option>
          </SelectField>
        ) : null}
        {schoolId === "other" || faculties.length === 0 || facultyId === "other" ? (
          <TextField id="newFacultyName" name="newFacultyName" label="Tên khoa" required />
        ) : null}
        <TextField id="className" name="className" label="Lớp (không bắt buộc)" placeholder="vd. 12DHKT01" />
      </Section>

      <Section title="3. Mục tiêu">
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Khối ngành">
          <span className="text-sm font-medium">Khối ngành (đổi được trước ngày 15)</span>
          {(Object.keys(TRACK_LABELS) as Track[]).map((track) => (
            <label key={track} className="flex items-center gap-3">
              <input type="radio" name="track" value={track} required className="size-5" />
              <span>
                {track}. {TRACK_LABELS[track]}
              </span>
            </label>
          ))}
        </div>
        <TextField id="targetPosition" name="targetPosition" label="Vị trí bạn muốn ứng tuyển sau khi ra trường" placeholder="vd. Nhân viên kế toán tổng hợp" required />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Công cụ AI bạn đang có (chọn nhiều)</span>
          {TOOL_OPTIONS.map((tool) => (
            <CheckboxField key={tool.key} id={`tool-${tool.key}`} name="tools" value={tool.key} label={tool.label} />
          ))}
        </div>
      </Section>

      <Section title="4. Tự đánh giá (1 = chưa biết, 5 = rất thành thạo)">
        {SELF_ASSESSMENT.map((q) => (
          <div key={q.key} className="flex flex-col gap-2" role="radiogroup" aria-label={q.label}>
            <span className="text-sm">{q.label}</span>
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
      </Section>

      <Section title="5. Đồng ý điều khoản">
        <p className="text-sm text-muted-foreground">
          Đọc{" "}
          <Link href="/dieu-khoan" target="_blank" className="text-primary underline">
            Điều khoản xử lý dữ liệu
          </Link>
          . Hai ô đầu là bắt buộc.
        </p>
        {CONSENT_KEYS.map((key) => (
          <CheckboxField
            key={key}
            id={`consent-${key}`}
            name="consents"
            value={key}
            label={`${CONSENT_LABELS[key]}${REQUIRED_CONSENTS.includes(key) ? " (bắt buộc)" : ""}`}
            required={REQUIRED_CONSENTS.includes(key)}
          />
        ))}
      </Section>

      {state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : "Bắt đầu lộ trình 30 ngày"}
      </Button>
    </form>
  );
}
