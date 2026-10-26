import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { enrollment } from "@/modules/enrollment/schema";
import { createEnrollment, extendEnrollment, getOpenEnrollment, pauseEnrollment, resumeEnrollment, changeTrack } from "@/modules/enrollment/service";
import { loadActor } from "@/modules/identity/actor";
import { hasRequiredConsents } from "@/modules/identity/consent";
import type { ConsentKey } from "@/modules/identity/consent-keys";
import { ForbiddenError } from "@/modules/identity/policy";
import { user } from "@/modules/identity/schema";
import { activationCode, school } from "@/modules/org/schema";
import { createActivationCode, createEvent, createFaculty, createSchool } from "@/modules/org/service";
import { resetDatabase } from "../../setup/reset";
import { signIn, staffActor, superAdminActor } from "../identity/helpers";

beforeEach(resetDatabase);
afterAll(closeDb);

const baseInput = {
  name: "Nguyễn Văn A",
  phone: "0901234567",
  studentCode: "2001234",
  className: "KT01",
  newFacultyName: "Kế toán",
  track: "B" as const,
  targetPosition: "Nhân viên kế toán",
  tools: ["free_chat"],
  selfAssessment: { delegate: 2, verify: 1, office: 2, jobHunt: 1, automation: 1 },
  consents: ["data_processing", "share_with_school", "zalo_notifications"] as ConsentKey[],
};

async function student(email = "sv@example.com") {
  const { userId } = await signIn(email);
  return (await loadActor(userId))!;
}

async function schoolWithCode(maxUses = 10) {
  const boss = await superAdminActor();
  const s = await createSchool(boss, { name: "ĐH Công Thương", connected: true });
  const f = await createFaculty(boss, { schoolId: s.id, name: "Kế toán" });
  const e = await createEvent(boss, { schoolId: s.id, name: "Workshop 1", heldOn: "2026-11-15" });
  const c = await createActivationCode(boss, { eventId: e.id, maxUses, validDays: 3 });
  return { s, f, e, c };
}

describe("createEnrollment", () => {
  it("đăng ký có mã: gắn sự kiện, trừ 1 lượt mã, lưu đồng ý, cập nhật tên, tự phân công mentor/TA", async () => {
    const { s, f, e, c } = await schoolWithCode();
    const mentor = await staffActor("mentor@example.com", "mentor");
    const ta = await staffActor("ta@example.com", "ta");
    const sv = await student();

    const result = await createEnrollment(sv, { ...baseInput, schoolId: s.id, facultyId: f.id, activationCode: c.code });
    expect(result.codeError).toBeNull();
    const row = (await getOpenEnrollment(sv.userId))!;
    expect(row).toMatchObject({ schoolId: s.id, facultyId: f.id, eventId: e.id, track: "B", mentorId: mentor.userId, taId: ta.userId, status: "active" });
    expect(row.classId).not.toBeNull();
    expect((await db.select().from(activationCode).where(eq(activationCode.id, c.id)))[0]?.usedCount).toBe(1);
    expect(await hasRequiredConsents(sv.userId)).toBe(true);
    expect((await db.select().from(user).where(eq(user.id, sv.userId)))[0]).toMatchObject({ name: "Nguyễn Văn A", phone: "0901234567" });
  });

  it("mã sai vẫn đăng ký được, kèm thông báo lỗi mã", async () => {
    const { s } = await schoolWithCode();
    const sv = await student();
    const result = await createEnrollment(sv, { ...baseInput, schoolId: s.id, newFacultyName: "Marketing", activationCode: "SAIMA123" });
    expect(result.codeError).toBe("Mã không đúng.");
    expect((await getOpenEnrollment(sv.userId))?.eventId).toBeNull();
  });

  it("trường chưa có thì tạo trường chờ xác minh", async () => {
    const sv = await student();
    await createEnrollment(sv, { ...baseInput, newSchoolName: "ĐH Mới Toanh", newFacultyName: "CNTT" });
    const row = (await getOpenEnrollment(sv.userId))!;
    const [s] = await db.select().from(school).where(eq(school.id, row.schoolId));
    expect(s).toMatchObject({ name: "ĐH Mới Toanh", status: "pending", connected: false });
  });

  it("thiếu ô đồng ý bắt buộc thì không tạo hồ sơ", async () => {
    const { s } = await schoolWithCode();
    const sv = await student();
    await expect(createEnrollment(sv, { ...baseInput, schoolId: s.id, consents: ["data_processing"] as ConsentKey[] })).rejects.toThrow(/đồng ý/);
    expect(await getOpenEnrollment(sv.userId)).toBeNull();
  });

  it("đã có hồ sơ đang mở thì không tạo hồ sơ thứ hai", async () => {
    const { s } = await schoolWithCode();
    const sv = await student();
    await createEnrollment(sv, { ...baseInput, schoolId: s.id });
    await expect(createEnrollment(sv, { ...baseInput, schoolId: s.id })).rejects.toThrow(/đã có hồ sơ/);
  });

  it("phân công mentor có ít SV nhất", async () => {
    const { s } = await schoolWithCode();
    const m1 = await staffActor("m1@example.com", "mentor");
    const m2 = await staffActor("m2@example.com", "mentor");
    const a = await student("a@example.com");
    const b = await student("b@example.com");
    await createEnrollment(a, { ...baseInput, schoolId: s.id });
    await createEnrollment(b, { ...baseInput, schoolId: s.id });
    const mentors = [(await getOpenEnrollment(a.userId))!.mentorId, (await getOpenEnrollment(b.userId))!.mentorId].sort();
    expect(mentors).toEqual([m1.userId, m2.userId].sort());
  });
});

describe("Gia hạn, bảo lưu, đổi khối", () => {
  async function enrolled() {
    const { s } = await schoolWithCode();
    const ta = await staffActor("ta@example.com", "ta");
    const sv = await student();
    await createEnrollment(sv, { ...baseInput, schoolId: s.id });
    return { sv, ta, row: (await getOpenEnrollment(sv.userId))! };
  }

  it("TA phụ trách gia hạn +7 ngày, chỉ 1 lần", async () => {
    const { ta, row } = await enrolled();
    await extendEnrollment(ta, row.id);
    expect((await db.select().from(enrollment).where(eq(enrollment.id, row.id)))[0]?.extensionDays).toBe(7);
    await expect(extendEnrollment(ta, row.id)).rejects.toThrow(/1 lần/);
  });

  it("SV không tự gia hạn được", async () => {
    const { sv, row } = await enrolled();
    await expect(extendEnrollment(sv, row.id)).rejects.toThrow(ForbiddenError);
  });

  it("bảo lưu rồi tiếp tục: cộng dồn số ngày bảo lưu, tối đa 14 ngày", async () => {
    const { ta, row } = await enrolled();
    await pauseEnrollment(ta, row.id);
    expect((await getOpenEnrollment(row.userId))?.status).toBe("paused");
    await db.update(enrollment).set({ pausedSince: new Date(Date.now() - 5 * 86_400_000) }).where(eq(enrollment.id, row.id));
    await resumeEnrollment(ta, row.id);
    const after = (await getOpenEnrollment(row.userId))!;
    expect(after).toMatchObject({ status: "active", pausedDays: 5, pausedSince: null });

    await db.update(enrollment).set({ pausedDays: 14 }).where(eq(enrollment.id, row.id));
    await expect(pauseEnrollment(ta, row.id)).rejects.toThrow(/14 ngày/);
  });

  it("SV đổi khối trước ngày 15, sau đó bị khóa", async () => {
    const { sv, row } = await enrolled();
    await changeTrack(sv, "C");
    expect((await getOpenEnrollment(sv.userId))?.track).toBe("C");
    const old = new Date(Date.now() - 20 * 86_400_000).toISOString().slice(0, 10);
    await db.update(enrollment).set({ startDate: old }).where(eq(enrollment.id, row.id));
    await expect(changeTrack(sv, "A")).rejects.toThrow(/ngày 15/);
  });
});
