import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { auditLog } from "@/lib/audit-schema";
import { closeDb, db } from "@/lib/db";
import { getActor, getValidSession } from "@/modules/identity/actor";
import { ForbiddenError } from "@/modules/identity/policy";
import { session } from "@/modules/identity/schema";
import { listMySessions, revokeAllSessions, revokeMySession } from "@/modules/identity/service";
import { resetDatabase } from "../../setup/reset";
import { signIn, staffActor, superAdminActor } from "./helpers";

async function ageSessions(userId: string, days: number) {
  await db.execute(sql`update "session" set updated_at = now() - make_interval(days => ${days}) where user_id = ${userId}`);
}

beforeEach(resetDatabase);
afterAll(closeDb);

describe("Thời hạn phiên", () => {
  it("SV không dùng quá 30 ngày thì phải đăng nhập lại (phiên bị xóa)", async () => {
    const { userId, cookie } = await signIn("sv@example.com");
    await ageSessions(userId, 29);
    expect(await getActor(new Headers({ cookie }))).not.toBeNull();
    await ageSessions(userId, 31);
    expect(await getActor(new Headers({ cookie }))).toBeNull();
    expect(await db.select().from(session).where(eq(session.userId, userId))).toHaveLength(0);
  });

  it("nhân sự không bị đăng xuất theo thời gian", async () => {
    const mentor = await staffActor("mentor@example.com", "mentor");
    const { cookie } = await signIn("mentor@example.com");
    await ageSessions(mentor.userId, 200);
    expect((await getActor(new Headers({ cookie })))?.userId).toBe(mentor.userId);
  });
});

describe("Quản lý thiết bị", () => {
  it("đăng xuất 1 thiết bị không ảnh hưởng thiết bị khác", async () => {
    const phone = await signIn("gv@example.com");
    const laptop = await signIn("gv@example.com");
    const actor = (await getActor(new Headers({ cookie: phone.cookie })))!;

    const current = await getValidSession(new Headers({ cookie: phone.cookie }));
    const devices = await listMySessions(actor, current!.session.id);
    expect(devices).toHaveLength(2);
    expect(devices.filter((d) => d.current)).toHaveLength(1);
    expect(devices[0]).not.toHaveProperty("token");

    const other = devices.find((d) => !d.current)!;
    await revokeMySession(actor, other.id);
    expect(await getActor(new Headers({ cookie: laptop.cookie }))).toBeNull();
    expect(await getActor(new Headers({ cookie: phone.cookie }))).not.toBeNull();
  });

  it("không đăng xuất được thiết bị của người khác", async () => {
    const a = await signIn("a@example.com");
    const b = await signIn("b@example.com");
    const actorA = (await getActor(new Headers({ cookie: a.cookie })))!;
    const [sessionB] = await db.select().from(session).where(eq(session.userId, b.userId));
    await revokeMySession(actorA, sessionB!.id);
    expect(await getActor(new Headers({ cookie: b.cookie }))).not.toBeNull();
  });

  it("admin thu hồi mọi phiên của một người, có ghi nhật ký", async () => {
    const boss = await superAdminActor();
    const target = await signIn("sv@example.com");
    await signIn("sv@example.com");
    await revokeAllSessions(boss, target.userId);
    expect(await db.select().from(session).where(eq(session.userId, target.userId))).toHaveLength(0);
    expect(await db.select().from(auditLog).where(eq(auditLog.action, "session.revoked_all"))).toHaveLength(1);
  });

  it("mentor không thu hồi được phiên của người khác", async () => {
    const mentor = await staffActor("mentor@example.com", "mentor");
    const target = await signIn("sv@example.com");
    await expect(revokeAllSessions(mentor, target.userId)).rejects.toThrow(ForbiddenError);
  });
});
