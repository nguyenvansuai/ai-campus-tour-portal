import { and, eq, isNull } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { REQUIRED_CONSENTS, type ConsentKey } from "./consent-keys";
import type { Actor } from "./policy";
import { consent } from "./schema";

/** Đổi khi điều khoản thay đổi: mọi người phải đồng ý lại ở lần đăng nhập kế tiếp. */
export const CURRENT_TERMS_VERSION = "2026-10-26-nhap";

/** Các ô người dùng đang đồng ý (chưa rút) của một phiên bản điều khoản. */
export async function getConsents(userId: string, termsVersion = CURRENT_TERMS_VERSION) {
  const rows = await db
    .select({ key: consent.consentKey, termsVersion: consent.termsVersion, grantedAt: consent.grantedAt })
    .from(consent)
    .where(and(eq(consent.userId, userId), eq(consent.termsVersion, termsVersion), isNull(consent.withdrawnAt)));
  return rows;
}

export async function hasRequiredConsents(userId: string, termsVersion = CURRENT_TERMS_VERSION) {
  const granted = new Set((await getConsents(userId, termsVersion)).map((row) => row.key));
  return REQUIRED_CONSENTS.every((key) => granted.has(key));
}

/** Người dùng tự đồng ý cho chính mình (giao diện tick ô nằm ở module enrollment). */
export async function grantConsents(actor: Actor, keys: ConsentKey[], termsVersion = CURRENT_TERMS_VERSION) {
  await db.transaction(async (tx) => {
    for (const key of keys) {
      const inserted = await tx
        .insert(consent)
        .values({ userId: actor.userId, consentKey: key, termsVersion })
        .onConflictDoNothing()
        .returning({ id: consent.id });
      if (inserted.length) {
        await recordAudit(
          { actorId: actor.userId, action: "consent.granted", targetType: "consent", targetId: inserted[0]!.id, metadata: { key, termsVersion } },
          tx,
        );
      }
    }
  });
}

export async function withdrawConsent(actor: Actor, key: ConsentKey, termsVersion = CURRENT_TERMS_VERSION) {
  if (REQUIRED_CONSENTS.includes(key)) {
    throw new Error("Không thể rút ô đồng ý bắt buộc. Muốn dừng tham gia, vui lòng liên hệ ban tổ chức.");
  }
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(consent)
      .set({ withdrawnAt: new Date() })
      .where(and(eq(consent.userId, actor.userId), eq(consent.consentKey, key), eq(consent.termsVersion, termsVersion), isNull(consent.withdrawnAt)))
      .returning({ id: consent.id });
    if (updated.length) {
      await recordAudit(
        { actorId: actor.userId, action: "consent.withdrawn", targetType: "consent", targetId: updated[0]!.id, metadata: { key, termsVersion } },
        tx,
      );
    }
  });
}
