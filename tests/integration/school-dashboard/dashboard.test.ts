import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb } from "@/lib/db";
import { loadActor } from "@/modules/identity/actor";
import type { ConsentKey } from "@/modules/identity/consent-keys";
import { ForbiddenError } from "@/modules/identity/policy";
import { inviteStaff } from "@/modules/identity/service";
import { createEnrollment, getOpenEnrollment } from "@/modules/enrollment/service";
import { createFaculty, createSchool } from "@/modules/org/service";
import { getStudentDetail, listStudents, summarize, toCsv } from "@/modules/school-dashboard/service";
import { resetDatabase } from "../../setup/reset";
import { signIn, superAdminActor } from "../identity/helpers";

beforeEach(resetDatabase);
afterAll(closeDb);

async function world() {
  const boss = await superAdminActor();
  const a = await createSchool(boss, { name: "ĐH A", connected: true });
  const b = await createSchool(boss, { name: "ĐH B" });
  const aKt = await createFaculty(boss, { schoolId: a.id, name: "Kế toán" });
  const aIt = await createFaculty(boss, { schoolId: a.id, name: "CNTT" });
  const bKt = await createFaculty(boss, { schoolId: b.id, name: "Kế toán" });
  const enroll = async (email: string, schoolId: string, facultyId: string, name = "=HYPERLINK(\"x\")") => {
    const { userId } = await signIn(email);
    const actor = (await loadActor(userId))!;
    await createEnrollment(actor, {
      name,
      schoolId,
      facultyId,
      track: "A",
      targetPosition: "Kế toán",
      tools: [],
      selfAssessment: { delegate: 1, verify: 1, office: 1, jobHunt: 1, automation: 1 },
      consents: ["data_processing", "share_with_school"] as ConsentKey[],
    });
    return (await getOpenEnrollment(userId))!;
  };
  const s1 = await enroll("a-kt@example.com", a.id, aKt.id, "Nguyễn Văn Kế");
  const s2 = await enroll("a-it@example.com", a.id, aIt.id, "Trần Thị Tin");
  const s3 = await enroll("b-kt@example.com", b.id, bKt.id);
  const staff = async (email: string, role: "teacher" | "school_manager" | "institute_viewer", scopeType: "global" | "school" | "faculty", scopeId: string | null) => {
    await inviteStaff(boss, { email, role, scopeType, scopeId });
    const { userId } = await signIn(email);
    return (await loadActor(userId))!;
  };
  return { boss, a, b, aKt, s1, s2, s3, staff };
}

describe("Phạm vi xem tiến độ", () => {
  it("GV khoa Kế toán trường A chỉ thấy SV khoa đó", async () => {
    const w = await world();
    const gv = await w.staff("gv@example.com", "teacher", "faculty", w.aKt.id);
    expect((await listStudents(gv)).map((r) => r.enrollmentId)).toEqual([w.s1.id]);
  });

  it("QL trường A thấy cả trường A, không thấy trường B; Viện thấy mọi trường", async () => {
    const w = await world();
    const ql = await w.staff("ql@example.com", "school_manager", "school", w.a.id);
    expect((await listStudents(ql)).map((r) => r.enrollmentId).sort()).toEqual([w.s1.id, w.s2.id].sort());
    const vien = await w.staff("vien@example.com", "institute_viewer", "global", null);
    expect(await listStudents(vien)).toHaveLength(3);
  });

  it("GV không xem được chi tiết SV ngoài phạm vi", async () => {
    const w = await world();
    const gv = await w.staff("gv@example.com", "teacher", "faculty", w.aKt.id);
    expect((await getStudentDetail(gv, w.s1.id))?.info.name).toBe("Nguyễn Văn Kế");
    await expect(getStudentDetail(gv, w.s3.id)).rejects.toThrow(ForbiddenError);
  });

  it("tổng hợp và cờ nguy cơ khi 7 ngày không hoạt động", async () => {
    const w = await world();
    const rows = await listStudents(w.boss);
    const summary = summarize(rows.map((r, i) => (i === 0 ? { ...r, atRisk: true, inactiveDays: 8 } : r)));
    expect(summary).toMatchObject({ total: 3, atRisk: 1 });
  });

  it("CSV có BOM, escape dấu nháy và chặn công thức Excel", async () => {
    const w = await world();
    const csv = toCsv(await listStudents(w.boss));
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("Nguyễn Văn Kế");
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });
});
