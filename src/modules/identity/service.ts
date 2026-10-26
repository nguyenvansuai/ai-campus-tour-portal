import { and, asc, count, desc, eq, exists, gt, gte, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { auditLog } from "@/lib/audit-schema";
import { db } from "@/lib/db";
import { escapeHtml, sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { ROLE_LABELS, SCOPE_LABELS } from "./labels";
import { authorize, ROLES, SCOPE_TYPES, type Actor, type Role } from "./policy";
import { roleAssignment, session, staffInvitation, user } from "./schema";

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
<p>Bạn được mời tham gia portal AI Campus Tour với vai trò <strong>${ROLE_LABELS[role]}</strong>${escapeHtml(where)}.</p>
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

/** Gọi sau khi tạo phiên đăng nhập: kích hoạt lời mời còn hạn, rồi ghi nhật ký nếu là nhân sự. */
export async function onSignedIn(params: { userId: string; email: string; ip: string | null }) {
  await acceptPendingInvitations(params.userId, params.email);
  const [staffGrant] = await db
    .select({ id: roleAssignment.id })
    .from(roleAssignment)
    .where(and(eq(roleAssignment.userId, params.userId), isNull(roleAssignment.revokedAt)))
    .limit(1);
  if (staffGrant) {
    await recordAudit({ actorId: params.userId, action: "auth.staff_sign_in", targetType: "user", targetId: params.userId, ip: params.ip });
  }
}

/** Kích hoạt mọi lời mời còn hạn gửi tới email của người dùng. */
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

// ---------------------------------------------------------------------------
// Quản trị người dùng

export type UserListQuery = { q?: string; role?: Role; page: number; pageSize: number };

export async function listUsers(actor: Actor, query: UserListQuery) {
  authorize(actor, "user.view_list", { kind: "user_admin" });
  const conditions = [];
  if (query.q?.trim()) {
    const pattern = `%${query.q.trim().toLowerCase()}%`;
    conditions.push(or(ilike(user.email, pattern), ilike(user.name, pattern)));
  }
  if (query.role) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(roleAssignment)
          .where(and(eq(roleAssignment.userId, user.id), eq(roleAssignment.role, query.role), isNull(roleAssignment.revokedAt))),
      ),
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(user).where(where);
  const rows = await db
    .select({ id: user.id, email: user.email, name: user.name, status: user.status, createdAt: user.createdAt })
    .from(user)
    .where(where)
    .orderBy(desc(user.createdAt), asc(user.email))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);

  const grants = rows.length
    ? await db
        .select({ userId: roleAssignment.userId, role: roleAssignment.role, scopeType: roleAssignment.scopeType, scopeId: roleAssignment.scopeId })
        .from(roleAssignment)
        .where(and(inArray(roleAssignment.userId, rows.map((row) => row.id)), isNull(roleAssignment.revokedAt)))
    : [];
  const items = rows.map((row) => ({
    ...row,
    roles: grants.filter((grant) => grant.userId === row.id).map(({ role, scopeType, scopeId }) => ({ role, scopeType, scopeId })),
  }));
  return { items, total: Number(total), page: query.page, pageSize: query.pageSize };
}

async function activeGrantsOf(userId: string) {
  return db
    .select({ id: roleAssignment.id, role: roleAssignment.role, scopeType: roleAssignment.scopeType, scopeId: roleAssignment.scopeId, createdAt: roleAssignment.createdAt })
    .from(roleAssignment)
    .where(and(eq(roleAssignment.userId, userId), isNull(roleAssignment.revokedAt)))
    .orderBy(asc(roleAssignment.createdAt));
}

export async function getUserDetail(actor: Actor, userId: string) {
  authorize(actor, "user.view_list", { kind: "user_admin" });
  const [account] = await db
    .select({ id: user.id, email: user.email, name: user.name, phone: user.phone, status: user.status, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.id, userId));
  if (!account) return null;
  const roles = await activeGrantsOf(userId);
  const [{ activeSessions }] = await db
    .select({ activeSessions: count() })
    .from(session)
    .where(and(eq(session.userId, userId), gt(session.expiresAt, new Date())));
  return { ...account, roles, activeSessions: Number(activeSessions) };
}

/** Quyền "user.manage" trên một tài khoản cụ thể (admin không thao tác được trên Super Admin). */
async function authorizeManage(actor: Actor, targetUserId: string) {
  const targetRoles = (await activeGrantsOf(targetUserId)).map((grant) => grant.role);
  authorize(actor, "user.manage", { kind: "user_admin", targetRoles });
}

export async function setUserStatus(actor: Actor, targetUserId: string, status: "active" | "suspended") {
  if (targetUserId === actor.userId) throw new Error("Không thể tự khóa hoặc mở khóa chính mình.");
  await authorizeManage(actor, targetUserId);
  await db.transaction(async (tx) => {
    await tx.update(user).set({ status, updatedAt: new Date() }).where(eq(user.id, targetUserId));
    if (status === "suspended") await tx.delete(session).where(eq(session.userId, targetUserId));
    await recordAudit(
      { actorId: actor.userId, action: status === "suspended" ? "user.suspended" : "user.reactivated", targetType: "user", targetId: targetUserId },
      tx,
    );
  });
}

export async function revokeRole(actor: Actor, assignmentId: string) {
  const [grant] = await db.select().from(roleAssignment).where(and(eq(roleAssignment.id, assignmentId), isNull(roleAssignment.revokedAt)));
  if (!grant) throw new Error("Vai trò không tồn tại hoặc đã bị thu hồi.");
  await authorizeManage(actor, grant.userId);
  if (grant.role === "super_admin") {
    authorize(actor, "role.grant_super_admin", { kind: "user_admin" });
    const [{ remaining }] = await db
      .select({ remaining: count() })
      .from(roleAssignment)
      .where(and(eq(roleAssignment.role, "super_admin"), isNull(roleAssignment.revokedAt)));
    if (Number(remaining) <= 1) throw new Error("Không thể thu hồi Super Admin cuối cùng.");
  }
  await db.transaction(async (tx) => {
    await tx.update(roleAssignment).set({ revokedAt: new Date() }).where(eq(roleAssignment.id, assignmentId));
    await recordAudit(
      {
        actorId: actor.userId,
        action: "role.revoked",
        targetType: "user",
        targetId: grant.userId,
        metadata: { role: grant.role, scopeType: grant.scopeType, scopeId: grant.scopeId },
      },
      tx,
    );
  });
}

// ---------------------------------------------------------------------------
// Phiên đăng nhập (thiết bị)

/** Thiết bị đang đăng nhập của chính người dùng. Không trả token phiên ra ngoài. */
export async function listMySessions(actor: Actor, currentSessionId: string | null) {
  const rows = await db
    .select({ id: session.id, userAgent: session.userAgent, ipAddress: session.ipAddress, createdAt: session.createdAt, updatedAt: session.updatedAt })
    .from(session)
    .where(and(eq(session.userId, actor.userId), gt(session.expiresAt, new Date())))
    .orderBy(desc(session.updatedAt));
  return rows.map((row) => ({ ...row, current: row.id === currentSessionId }));
}

export async function revokeMySession(actor: Actor, sessionId: string) {
  await db.delete(session).where(and(eq(session.id, sessionId), eq(session.userId, actor.userId)));
}

export async function revokeAllSessions(actor: Actor, targetUserId: string) {
  await authorizeManage(actor, targetUserId);
  await db.transaction(async (tx) => {
    await tx.delete(session).where(eq(session.userId, targetUserId));
    await recordAudit({ actorId: actor.userId, action: "session.revoked_all", targetType: "user", targetId: targetUserId }, tx);
  });
}

// ---------------------------------------------------------------------------
// Nhật ký

export type AuditQuery = { action?: string; actorEmail?: string; from?: Date; to?: Date; page: number; pageSize: number };

export async function listAuditLogs(actor: Actor, query: AuditQuery) {
  authorize(actor, "audit.view", { kind: "audit_log" });
  const conditions = [];
  if (query.action) conditions.push(eq(auditLog.action, query.action));
  if (query.actorEmail?.trim()) conditions.push(ilike(user.email, `%${query.actorEmail.trim().toLowerCase()}%`));
  if (query.from) conditions.push(gte(auditLog.createdAt, query.from));
  if (query.to) conditions.push(lte(auditLog.createdAt, query.to));
  const where = conditions.length ? and(...conditions) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(auditLog).leftJoin(user, eq(user.id, auditLog.actorId)).where(where);
  const items = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      metadata: auditLog.metadata,
      ip: auditLog.ip,
      createdAt: auditLog.createdAt,
      actorEmail: user.email,
    })
    .from(auditLog)
    .leftJoin(user, eq(user.id, auditLog.actorId))
    .where(where)
    .orderBy(desc(auditLog.createdAt))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);
  return { items, total: Number(total), page: query.page, pageSize: query.pageSize };
}
