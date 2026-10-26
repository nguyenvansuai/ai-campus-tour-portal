import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { auditLog } from "@/lib/audit-schema";
import { closeDb, db } from "@/lib/db";
import { getActor, loadActor } from "@/modules/identity/actor";
import { ForbiddenError } from "@/modules/identity/policy";
import { roleAssignment, session } from "@/modules/identity/schema";
import { getUserDetail, listUsers, revokeRole, setUserStatus } from "@/modules/identity/service";
import { resetDatabase } from "../../setup/reset";
import { signIn, staffActor, superAdminActor } from "./helpers";

beforeEach(resetDatabase);
afterAll(closeDb);

describe("listUsers", () => {
  it("tìm theo email/tên, lọc theo vai trò, phân trang", async () => {
    const boss = await superAdminActor();
    for (let i = 0; i < 3; i++) await signIn(`sv${i}@example.com`);
    await staffActor("mentor@example.com", "mentor");

    const all = await listUsers(boss, { page: 1, pageSize: 2 });
    expect(all.total).toBe(5);
    expect(all.items).toHaveLength(2);

    const found = await listUsers(boss, { q: "SV1", page: 1, pageSize: 20 });
    expect(found.items.map((u) => u.email)).toEqual(["sv1@example.com"]);

    const mentors = await listUsers(boss, { role: "mentor", page: 1, pageSize: 20 });
    expect(mentors.items.map((u) => u.email)).toEqual(["mentor@example.com"]);
    expect(mentors.items[0]?.roles.map((r) => r.role)).toEqual(["mentor"]);
  });

  it("mentor không xem được danh sách người dùng", async () => {
    const mentor = await staffActor("mentor@example.com", "mentor");
    await expect(listUsers(mentor, { page: 1, pageSize: 20 })).rejects.toThrow(ForbiddenError);
  });
});

describe("setUserStatus", () => {
  it("khóa tài khoản thì mọi phiên bị thu hồi và request kế tiếp bị từ chối", async () => {
    const boss = await superAdminActor();
    const { userId, cookie } = await signIn("sv@example.com");
    expect(await getActor(new Headers({ cookie }))).not.toBeNull();

    await setUserStatus(boss, userId, "suspended");

    expect(await db.select().from(session).where(eq(session.userId, userId))).toHaveLength(0);
    expect(await getActor(new Headers({ cookie }))).toBeNull();
    const logs = await db.select().from(auditLog).where(eq(auditLog.action, "user.suspended"));
    expect(logs).toHaveLength(1);

    await setUserStatus(boss, userId, "active");
    expect((await loadActor(userId))?.status).toBe("active");
  });

  it("không tự khóa chính mình", async () => {
    const boss = await superAdminActor();
    await expect(setUserStatus(boss, boss.userId, "suspended")).rejects.toThrow(/chính mình/);
  });

  it("admin không khóa được Super Admin", async () => {
    const boss = await superAdminActor();
    const admin = await staffActor("admin@example.com", "admin");
    await expect(setUserStatus(admin, boss.userId, "suspended")).rejects.toThrow(ForbiddenError);
  });
});

describe("revokeRole", () => {
  it("thu hồi có hiệu lực ngay và ghi nhật ký", async () => {
    const boss = await superAdminActor();
    const mentor = await staffActor("mentor@example.com", "mentor");
    const [grant] = await db.select().from(roleAssignment).where(eq(roleAssignment.userId, mentor.userId));

    await revokeRole(boss, grant!.id);

    expect((await loadActor(mentor.userId))?.roles).toEqual([]);
    expect(await db.select().from(auditLog).where(eq(auditLog.action, "role.revoked"))).toHaveLength(1);
  });

  it("không thu hồi được Super Admin cuối cùng", async () => {
    const boss = await superAdminActor();
    const [grant] = await db.select().from(roleAssignment).where(eq(roleAssignment.userId, boss.userId));
    await expect(revokeRole(boss, grant!.id)).rejects.toThrow(/Super Admin cuối cùng/);
  });

  it("admin không thu hồi được vai trò Super Admin", async () => {
    await superAdminActor("boss2@example.com");
    const boss = await superAdminActor();
    const admin = await staffActor("admin@example.com", "admin");
    const [grant] = await db.select().from(roleAssignment).where(eq(roleAssignment.userId, boss.userId));
    await expect(revokeRole(admin, grant!.id)).rejects.toThrow(ForbiddenError);
  });
});

describe("getUserDetail", () => {
  it("trả về thông tin, vai trò còn hiệu lực và số thiết bị đang đăng nhập", async () => {
    const boss = await superAdminActor();
    const { userId } = await signIn("sv@example.com");
    const detail = await getUserDetail(boss, userId);
    expect(detail).toMatchObject({ email: "sv@example.com", status: "active", activeSessions: 1, roles: [] });
  });
});
