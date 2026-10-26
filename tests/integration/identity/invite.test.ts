import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { auditLog } from "@/lib/audit-schema";
import { closeDb, db } from "@/lib/db";
import { memoryOutbox } from "@/lib/email";
import { createSuperAdmin } from "@/modules/identity/admin-bootstrap";
import { loadActor } from "@/modules/identity/actor";
import { auth } from "@/modules/identity/auth";
import { ForbiddenError, type Actor } from "@/modules/identity/policy";
import { staffInvitation, user } from "@/modules/identity/schema";
import { inviteStaff, InviteStaffInput } from "@/modules/identity/service";
import { resetDatabase } from "../../setup/reset";

async function signIn(email: string) {
  await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
  const otp = memoryOutbox.findLast((m) => m.to === email && /Mã đăng nhập/.test(m.subject))!.text.match(/\b(\d{6})\b/)![1];
  await auth.api.signInEmailOTP({ body: { email, otp } });
  const [row] = await db.select().from(user).where(eq(user.email, email));
  return row!.id;
}

async function superAdmin(): Promise<Actor> {
  const { userId } = await createSuperAdmin("boss@example.com");
  return (await loadActor(userId))!;
}

async function adminActor(): Promise<Actor> {
  const boss = await superAdmin();
  await inviteStaff(boss, { email: "admin@example.com", role: "admin", scopeType: "global", scopeId: null });
  const id = await signIn("admin@example.com");
  return (await loadActor(id))!;
}

beforeEach(resetDatabase);
afterAll(closeDb);

describe("Mời nhân sự", () => {
  it("người được mời đăng nhập lần đầu thì có đúng vai trò và phạm vi", async () => {
    const boss = await superAdmin();
    await inviteStaff(boss, { email: "ThayCuong@Example.com", role: "school_manager", scopeType: "school", scopeId: "school-a" });

    const invite = memoryOutbox.findLast((m) => m.to === "thaycuong@example.com");
    expect(invite?.subject).toMatch(/lời mời/i);
    expect(invite?.text).toContain("Quản lý trường");

    const id = await signIn("thaycuong@example.com");
    const actor = await loadActor(id);
    expect(actor?.roles).toEqual([{ role: "school_manager", scopeType: "school", scopeId: "school-a" }]);
    const [row] = await db.select().from(staffInvitation);
    expect(row?.acceptedAt).not.toBeNull();
  });

  it("người đã có tài khoản thì được gán vai trò ngay", async () => {
    const id = await signIn("mentor@example.com");
    const boss = await superAdmin();
    await inviteStaff(boss, { email: "mentor@example.com", role: "mentor", scopeType: "global", scopeId: null });
    expect((await loadActor(id))?.roles.map((r) => r.role)).toEqual(["mentor"]);
  });

  it("lời mời quá 14 ngày thì không kích hoạt", async () => {
    const boss = await superAdmin();
    await inviteStaff(boss, { email: "tre@example.com", role: "ta", scopeType: "global", scopeId: null });
    const [row] = await db.select().from(staffInvitation);
    expect((row!.expiresAt.getTime() - row!.createdAt.getTime()) / 86_400_000).toBeCloseTo(14, 0);
    await db.update(staffInvitation).set({ expiresAt: new Date(Date.now() - 1000) });
    const id = await signIn("tre@example.com");
    expect((await loadActor(id))?.roles).toEqual([]);
  });

  it("admin KHÔNG mời được super_admin", async () => {
    const admin = await adminActor();
    await expect(
      inviteStaff(admin, { email: "x@example.com", role: "super_admin", scopeType: "global", scopeId: null }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("người không có quyền quản trị thì không mời được", async () => {
    const id = await signIn("sv@example.com");
    const student = (await loadActor(id))!;
    await expect(
      inviteStaff(student, { email: "x@example.com", role: "mentor", scopeType: "global", scopeId: null }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("ghi nhật ký khi mời và khi vai trò được kích hoạt", async () => {
    const boss = await superAdmin();
    await inviteStaff(boss, { email: "gv@example.com", role: "teacher", scopeType: "class", scopeId: "class-1" });
    await signIn("gv@example.com");
    const actions = (await db.select({ action: auditLog.action }).from(auditLog)).map((r) => r.action);
    expect(actions).toEqual(expect.arrayContaining(["staff.invited", "role.granted"]));
  });
});

describe("InviteStaffInput", () => {
  it.each([
    [{ email: "a@b.vn", role: "teacher", scopeType: "global", scopeId: null }, false],
    [{ email: "a@b.vn", role: "teacher", scopeType: "class", scopeId: "" }, false],
    [{ email: "a@b.vn", role: "mentor", scopeType: "school", scopeId: "s1" }, false],
    [{ email: "khong-hop-le", role: "mentor", scopeType: "global", scopeId: null }, false],
    [{ email: "a@b.vn", role: "teacher", scopeType: "faculty", scopeId: "f1" }, true],
    [{ email: "a@b.vn", role: "admin", scopeType: "global", scopeId: null }, true],
  ])("kiểm tra %o → hợp lệ: %s", (input, ok) => {
    expect(InviteStaffInput.safeParse(input).success).toBe(ok);
  });
});
