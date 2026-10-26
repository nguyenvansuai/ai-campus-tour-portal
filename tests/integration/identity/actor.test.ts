import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { memoryOutbox } from "@/lib/email";
import { auditLog } from "@/lib/audit-schema";
import { recordAudit } from "@/lib/audit";
import { createSuperAdmin } from "@/modules/identity/admin-bootstrap";
import { getActor, loadActor } from "@/modules/identity/actor";
import { auth } from "@/modules/identity/auth";
import { roleAssignment, user } from "@/modules/identity/schema";
import { resetDatabase } from "../../setup/reset";

async function signedInHeaders(email: string) {
  await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
  const otp = memoryOutbox.findLast((m) => m.to === email)!.text.match(/\b(\d{6})\b/)![1];
  const { headers } = await auth.api.signInEmailOTP({ body: { email, otp }, returnHeaders: true });
  const cookie = headers.get("set-cookie")!.split(";")[0];
  return new Headers({ cookie });
}

beforeEach(resetDatabase);
afterAll(closeDb);

describe("loadActor / getActor", () => {
  it("chỉ lấy vai trò còn hiệu lực", async () => {
    const headers = await signedInHeaders("gv@example.com");
    const [row] = await db.select().from(user).where(eq(user.email, "gv@example.com"));
    await db.insert(roleAssignment).values([
      { userId: row!.id, role: "teacher", scopeType: "school", scopeId: "school-a" },
      { userId: row!.id, role: "mentor", revokedAt: new Date() },
    ]);
    const actor = await getActor(headers);
    expect(actor?.userId).toBe(row!.id);
    expect(actor?.roles).toEqual([{ role: "teacher", scopeType: "school", scopeId: "school-a" }]);
  });

  it("không có phiên đăng nhập thì trả về null", async () => {
    expect(await getActor(new Headers())).toBeNull();
  });

  it("phản ánh trạng thái khóa tài khoản", async () => {
    await signedInHeaders("sv@example.com");
    const [row] = await db.select().from(user).where(eq(user.email, "sv@example.com"));
    await db.update(user).set({ status: "suspended" }).where(eq(user.id, row!.id));
    expect((await loadActor(row!.id))?.status).toBe("suspended");
  });
});

describe("recordAudit", () => {
  it("ghi một dòng nhật ký", async () => {
    await recordAudit({ actorId: null, action: "test.done", targetType: "user", targetId: "u-1", metadata: { a: 1 }, ip: "1.2.3.4" });
    const rows = await db.select().from(auditLog);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ action: "test.done", targetType: "user", targetId: "u-1", metadata: { a: 1 }, ip: "1.2.3.4" });
  });
});

describe("createSuperAdmin", () => {
  it("tạo tài khoản + vai trò super_admin, chạy lại không tạo trùng, có ghi nhật ký", async () => {
    await createSuperAdmin("NguyenVanSuTT@Gmail.com");
    await createSuperAdmin("nguyenvansutt@gmail.com");
    const users = await db.select().from(user).where(eq(user.email, "nguyenvansutt@gmail.com"));
    expect(users).toHaveLength(1);
    const grants = await db.select().from(roleAssignment).where(eq(roleAssignment.userId, users[0]!.id));
    expect(grants.map((g) => g.role)).toEqual(["super_admin"]);
    const logs = await db.select().from(auditLog).where(eq(auditLog.action, "role.granted"));
    expect(logs).toHaveLength(1);
  });

  it("gán cho tài khoản đã đăng nhập trước đó", async () => {
    await signedInHeaders("co-san@example.com");
    await createSuperAdmin("co-san@example.com");
    const actor = await loadActor((await db.select().from(user).where(eq(user.email, "co-san@example.com")))[0]!.id);
    expect(actor?.roles.map((r) => r.role)).toEqual(["super_admin"]);
  });
});
