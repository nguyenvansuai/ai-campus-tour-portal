import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { ROLE_LABELS, SCOPE_LABELS } from "./labels";
import { authorize, ROLES, SCOPE_TYPES, type Actor, type Role } from "./policy";
import { roleAssignment, staffInvitation, user } from "./schema";

const INVITATION_DAYS = 14;
const SCOPED_ROLES: ReadonlySet<Role> = new Set(["school_manager", "teacher"]);

export const InviteStaffInput = z
  .object({
    email: z.email("Email không hợp lệ.").transform((value) => value.trim().toLowerCase()),
    role: z.enum(ROLES),
    scopeType: z.enum(SCOPE_TYPES),
    scopeId: z.string().trim().nullable(),
  })
  .superRefine((value, ctx) => {
    if (SCOPED_ROLES.has(value.role)) {
      if (value.scopeType === "global") {
        ctx.addIssue({ code: "custom", path: ["scopeType"], message: "Vai trò này phải gắn với trường, khoa hoặc lớp." });
      }
      if (!value.scopeId) ctx.addIssue({ code: "custom", path: ["scopeId"], message: "Vui lòng chọn trường/khoa/lớp." });
    } else if (value.scopeType !== "global") {
      ctx.addIssue({ code: "custom", path: ["scopeType"], message: "Vai trò này áp dụng toàn hệ thống." });
    }
  });
export type InviteStaffInput = z.input<typeof InviteStaffInput>;

type Executor = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function grantRole(
  tx: Executor,
  params: { userId: string; role: Role; scopeType: (typeof SCOPE_TYPES)[number]; scopeId: string | null; grantedBy: string | null; via: string },
) {
  const inserted = await tx
    .insert(roleAssignment)
    .values({ userId: params.userId, role: params.role, scopeType: params.scopeType, scopeId: params.scopeId, grantedBy: params.grantedBy })
    .onConflictDoNothing()
    .returning({ id: roleAssignment.id });
  if (inserted.length === 0) return;
  await recordAudit(
    {
      actorId: params.grantedBy,
      action: "role.granted",
      targetType: "user",
      targetId: params.userId,
      metadata: { role: params.role, scopeType: params.scopeType, scopeId: params.scopeId, via: params.via },
    },
    tx,
  );
}

function renderInvitationEmail(role: Role, scopeType: (typeof SCOPE_TYPES)[number], scopeId: string | null) {
  const where = scopeType === "global" ? "" : ` (${SCOPE_LABELS[scopeType]}: ${scopeId})`;
  const url = `${env().APP_URL}/dang-nhap`;
  const text = [
    `Bạn được mời tham gia portal AI Campus Tour với vai trò ${ROLE_LABELS[role]}${where}.`,
    "",
    `Đăng nhập tại ${url} bằng chính địa chỉ email này. Lời mời có hiệu lực ${INVITATION_DAYS} ngày.`,
  ].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5">
<p>Bạn được mời tham gia portal AI Campus Tour với vai trò <strong>${ROLE_LABELS[role]}</strong>${where}.</p>
<p><a href="${url}">Đăng nhập</a> bằng chính địa chỉ email này. Lời mời có hiệu lực ${INVITATION_DAYS} ngày.</p>
</div>`;
  return { subject: "Lời mời tham gia AI Campus Tour", text, html };
}

/** Mời nhân sự. Nếu email đã có tài khoản thì gán vai trò ngay. */
export async function inviteStaff(actor: Actor, rawInput: InviteStaffInput) {
  authorize(actor, "user.invite_staff", { kind: "user_admin" });
  const input = InviteStaffInput.parse(rawInput);
  if (input.role === "super_admin") authorize(actor, "role.grant_super_admin", { kind: "user_admin" });
  const scopeId = input.scopeType === "global" ? null : input.scopeId;

  const invitation = await db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: user.id }).from(user).where(eq(user.email, input.email));
    const [created] = await tx
      .insert(staffInvitation)
      .values({
        email: input.email,
        role: input.role,
        scopeType: input.scopeType,
        scopeId,
        invitedBy: actor.userId,
        expiresAt: new Date(Date.now() + INVITATION_DAYS * 86_400_000),
        acceptedAt: existing ? new Date() : null,
      })
      .returning();
    await recordAudit(
      {
        actorId: actor.userId,
        action: "staff.invited",
        targetType: "staff_invitation",
        targetId: created!.id,
        metadata: { email: input.email, role: input.role, scopeType: input.scopeType, scopeId },
      },
      tx,
    );
    if (existing) {
      await grantRole(tx, { userId: existing.id, role: input.role, scopeType: input.scopeType, scopeId, grantedBy: actor.userId, via: "invitation" });
    }
    return created!;
  });

  await sendEmail({ to: input.email, ...renderInvitationEmail(input.role, input.scopeType, scopeId) });
  return invitation;
}

/** Gọi sau khi người dùng đăng nhập: kích hoạt mọi lời mời còn hạn gửi tới email của họ. */
export async function acceptPendingInvitations(userId: string, email: string) {
  await db.transaction(async (tx) => {
    const pending = await tx
      .select()
      .from(staffInvitation)
      .where(and(eq(staffInvitation.email, email.toLowerCase()), isNull(staffInvitation.acceptedAt), gt(staffInvitation.expiresAt, new Date())));
    for (const invitation of pending) {
      await grantRole(tx, {
        userId,
        role: invitation.role,
        scopeType: invitation.scopeType,
        scopeId: invitation.scopeId,
        grantedBy: invitation.invitedBy,
        via: "invitation",
      });
      await tx.update(staffInvitation).set({ acceptedAt: new Date() }).where(eq(staffInvitation.id, invitation.id));
    }
  });
}
