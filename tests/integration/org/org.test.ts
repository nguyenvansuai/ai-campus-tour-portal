import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { ForbiddenError } from "@/modules/identity/policy";
import { activationCode, faculty, school, schoolClass } from "@/modules/org/schema";
import {
  createActivationCode,
  createClass,
  createEvent,
  createFaculty,
  createSchool,
  findOrCreateSchoolBySelfReport,
  listSchoolsForPicker,
  mergeSchools,
  redeemActivationCode,
  updateSchool,
} from "@/modules/org/service";
import { resetDatabase } from "../../setup/reset";
import { staffActor, superAdminActor } from "../identity/helpers";

beforeEach(resetDatabase);
afterAll(closeDb);

describe("Trường, khoa, lớp", () => {
  it("admin tạo trường/khoa/lớp; tên trùng (không phân biệt hoa thường) bị từ chối", async () => {
    const boss = await superAdminActor();
    const s = await createSchool(boss, { name: "Trường ĐH Công Thương TP.HCM", shortName: "HUIT", connected: true });
    const f = await createFaculty(boss, { schoolId: s.id, name: "Khoa Kế toán" });
    await createClass(boss, { facultyId: f.id, name: "KT01" });
    await expect(createSchool(boss, { name: "trường đh công thương tp.hcm" })).rejects.toThrow(/đã có/);
    const picker = await listSchoolsForPicker();
    expect(picker[0]).toMatchObject({ name: "Trường ĐH Công Thương TP.HCM", faculties: [{ name: "Khoa Kế toán", classes: [{ name: "KT01" }] }] });
  });

  it("người không phải admin không quản lý được danh mục", async () => {
    const mentor = await staffActor("mentor@example.com", "mentor");
    await expect(createSchool(mentor, { name: "X" })).rejects.toThrow(ForbiddenError);
  });

  it("SV nhập trường chưa có thì tạo trường chờ xác minh, nhập lại cùng tên thì dùng lại", async () => {
    const a = await findOrCreateSchoolBySelfReport("Trường ĐH Mới", null);
    const b = await findOrCreateSchoolBySelfReport("  trường đh  mới ", null);
    expect(a.id).toBe(b.id);
    expect(a.status).toBe("pending");
    expect(a.connected).toBe(false);
  });

  it("admin xác minh và bật cờ đã kết nối", async () => {
    const boss = await superAdminActor();
    const s = await findOrCreateSchoolBySelfReport("Trường ĐH Mới", null);
    await updateSchool(boss, s.id, { status: "verified", connected: true });
    const [row] = await db.select().from(school).where(eq(school.id, s.id));
    expect(row).toMatchObject({ status: "verified", connected: true });
  });

  it("gộp trường: khoa/lớp chuyển sang trường giữ lại, khoa trùng tên thì gộp lớp", async () => {
    const boss = await superAdminActor();
    const keep = await createSchool(boss, { name: "ĐH Công Thương" });
    const dup = await findOrCreateSchoolBySelfReport("DH Cong Thuong", null);
    const keepKt = await createFaculty(boss, { schoolId: keep.id, name: "Kế toán" });
    const dupKt = await createFaculty(boss, { schoolId: dup.id, name: "kế toán" });
    const dupIt = await createFaculty(boss, { schoolId: dup.id, name: "CNTT" });
    await createClass(boss, { facultyId: dupKt.id, name: "KT02" });

    await mergeSchools(boss, { keepId: keep.id, removeId: dup.id });

    expect(await db.select().from(school).where(eq(school.id, dup.id))).toHaveLength(0);
    const faculties = await db.select().from(faculty).where(eq(faculty.schoolId, keep.id));
    expect(faculties.map((f) => f.name).sort()).toEqual(["CNTT", "Kế toán"]);
    const classes = await db.select().from(schoolClass).where(eq(schoolClass.facultyId, keepKt.id));
    expect(classes.map((c) => c.name)).toEqual(["KT02"]);
    expect(faculties.find((f) => f.id === dupIt.id)).toBeDefined();
  });
});

describe("Mã kích hoạt", () => {
  async function setup(maxUses = 2, days = 3) {
    const boss = await superAdminActor();
    const s = await createSchool(boss, { name: "ĐH Công Thương" });
    const e = await createEvent(boss, { schoolId: s.id, name: "Workshop 1", heldOn: "2026-11-15" });
    const c = await createActivationCode(boss, { eventId: e.id, maxUses, validDays: days });
    return { s, e, c };
  }

  it("dùng được mã còn hạn, còn lượt; trả về trường và sự kiện; không phân biệt hoa thường", async () => {
    const { s, e, c } = await setup();
    const result = await redeemActivationCode(c.code.toLowerCase());
    expect(result).toMatchObject({ ok: true, eventId: e.id, schoolId: s.id });
  });

  it("hết lượt thì từ chối", async () => {
    const { c } = await setup(1);
    await redeemActivationCode(c.code);
    expect(await redeemActivationCode(c.code)).toEqual({ ok: false, reason: "Mã đã dùng hết lượt." });
  });

  it("hết hạn thì từ chối", async () => {
    const { c } = await setup();
    await db.update(activationCode).set({ expiresAt: new Date(Date.now() - 1000) });
    expect(await redeemActivationCode(c.code)).toEqual({ ok: false, reason: "Mã đã hết hạn." });
  });

  it("mã không tồn tại", async () => {
    expect(await redeemActivationCode("ZZZZZZZZ")).toEqual({ ok: false, reason: "Mã không đúng." });
  });

  it("2 request cùng lúc với mã còn 1 lượt chỉ 1 request thành công", async () => {
    const { c } = await setup(1);
    const results = await Promise.all([redeemActivationCode(c.code), redeemActivationCode(c.code)]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
  });
});
