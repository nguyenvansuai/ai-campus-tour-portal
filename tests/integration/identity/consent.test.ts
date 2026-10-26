import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { auditLog } from "@/lib/audit-schema";
import { closeDb, db } from "@/lib/db";
import { loadActor } from "@/modules/identity/actor";
import { CURRENT_TERMS_VERSION, getConsents, grantConsents, hasRequiredConsents, withdrawConsent } from "@/modules/identity/consent";
import { resetDatabase } from "../../setup/reset";
import { signIn } from "./helpers";

beforeEach(resetDatabase);
afterAll(closeDb);

async function student() {
  const { userId } = await signIn("sv@example.com");
  return (await loadActor(userId))!;
}

describe("Đồng ý điều khoản", () => {
  it("chỉ đủ khi đồng ý cả 2 ô bắt buộc của phiên bản hiện hành", async () => {
    const actor = await student();
    expect(await hasRequiredConsents(actor.userId)).toBe(false);
    await grantConsents(actor, ["data_processing"]);
    expect(await hasRequiredConsents(actor.userId)).toBe(false);
    await grantConsents(actor, ["share_with_school", "zalo_notifications"]);
    expect(await hasRequiredConsents(actor.userId)).toBe(true);

    const consents = await getConsents(actor.userId);
    expect(consents.map((c) => c.key).sort()).toEqual(["data_processing", "share_with_school", "zalo_notifications"]);
    expect(consents.every((c) => c.termsVersion === CURRENT_TERMS_VERSION)).toBe(true);
  });

  it("đổi phiên bản điều khoản thì phải đồng ý lại", async () => {
    const actor = await student();
    await grantConsents(actor, ["data_processing", "share_with_school"]);
    expect(await hasRequiredConsents(actor.userId, "phien-ban-moi")).toBe(false);
  });

  it("rút đồng ý ô không bắt buộc, có ghi nhật ký", async () => {
    const actor = await student();
    await grantConsents(actor, ["data_processing", "share_with_school", "sponsor_referral"]);
    await withdrawConsent(actor, "sponsor_referral");
    expect((await getConsents(actor.userId)).map((c) => c.key)).not.toContain("sponsor_referral");
    const actions = (await db.select({ action: auditLog.action }).from(auditLog).where(eq(auditLog.actorId, actor.userId))).map((r) => r.action);
    expect(actions).toEqual(expect.arrayContaining(["consent.granted", "consent.withdrawn"]));
  });

  it("không rút được ô bắt buộc (muốn rút thì dừng tham gia, xử lý riêng)", async () => {
    const actor = await student();
    await grantConsents(actor, ["data_processing", "share_with_school"]);
    await expect(withdrawConsent(actor, "data_processing")).rejects.toThrow(/bắt buộc/);
  });

  it("đồng ý lại cùng ô không tạo bản ghi trùng", async () => {
    const actor = await student();
    await grantConsents(actor, ["data_processing"]);
    await grantConsents(actor, ["data_processing"]);
    expect(await getConsents(actor.userId)).toHaveLength(1);
  });
});
