import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { recordAudit } from "@/lib/audit";
import { closeDb } from "@/lib/db";
import { ForbiddenError } from "@/modules/identity/policy";
import { listAuditLogs } from "@/modules/identity/service";
import { resetDatabase } from "../../setup/reset";
import { staffActor, superAdminActor } from "./helpers";

beforeEach(resetDatabase);
afterAll(closeDb);

describe("listAuditLogs", () => {
  it("mới nhất trước, kèm email người thực hiện, lọc theo hành động và người thực hiện", async () => {
    const boss = await superAdminActor();
    await staffActor("mentor@example.com", "mentor");
    await recordAudit({ actorId: boss.userId, action: "user.suspended", targetType: "user", targetId: "x" });

    const all = await listAuditLogs(boss, { page: 1, pageSize: 50 });
    expect(all.items[0]?.action).toBe("user.suspended");
    expect(all.items[0]?.actorEmail).toBe("boss@example.com");

    const invites = await listAuditLogs(boss, { action: "staff.invited", page: 1, pageSize: 50 });
    expect(invites.items.map((i) => i.action)).toEqual(["staff.invited"]);

    const byBoss = await listAuditLogs(boss, { actorEmail: "boss@", page: 1, pageSize: 50 });
    expect(byBoss.items.every((i) => i.actorEmail === "boss@example.com")).toBe(true);
    expect(byBoss.total).toBeGreaterThan(0);
  });

  it("lọc theo khoảng thời gian", async () => {
    const boss = await superAdminActor();
    const tomorrow = new Date(Date.now() + 86_400_000);
    const result = await listAuditLogs(boss, { from: tomorrow, page: 1, pageSize: 50 });
    expect(result.total).toBe(0);
  });

  it("mentor không xem được nhật ký", async () => {
    const mentor = await staffActor("mentor@example.com", "mentor");
    await expect(listAuditLogs(mentor, { page: 1, pageSize: 50 })).rejects.toThrow(ForbiddenError);
  });
});
