import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ROLE_LABELS, SCOPE_LABELS } from "@/modules/identity/labels";
import { getUserDetail } from "@/modules/identity/service";
import { requirePermission } from "@/modules/identity/session";
import { RevokeAllSessionsButton, RevokeRoleButton, UserStatusButton } from "@/modules/identity/ui/manage-buttons";

export const metadata: Metadata = { title: "Chi tiết người dùng · AI Campus Tour" };

export default async function UserDetailPage({ params }: PageProps<"/admin/nguoi-dung/[id]">) {
  const actor = await requirePermission("user.view_list", { kind: "user_admin" });
  const { id } = await params;
  const detail = await getUserDetail(actor, id);
  if (!detail) notFound();

  return (
    <main className="flex max-w-2xl flex-col gap-6">
      <Link href="/admin/nguoi-dung" className="text-sm text-primary">
        ← Người dùng
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold break-all">{detail.email}</h1>
        <p className="text-muted-foreground">
          {detail.name || "Chưa có tên"} · {detail.status === "active" ? "Đang hoạt động" : "Đã khóa"} · {detail.activeSessions} thiết bị đang
          đăng nhập
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Vai trò</h2>
        {detail.roles.length === 0 ? <p className="text-muted-foreground">Không có vai trò nhân sự (sinh viên).</p> : null}
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {detail.roles.map((grant) => {
            const label = `${ROLE_LABELS[grant.role]}${grant.scopeId ? ` · ${SCOPE_LABELS[grant.scopeType]} ${grant.scopeId}` : ""}`;
            return (
              <li key={grant.id} className="flex items-center justify-between gap-3 p-4">
                <span>{label}</span>
                {actor.userId !== detail.id || grant.role !== "super_admin" ? <RevokeRoleButton assignmentId={grant.id} label={label} /> : null}
              </li>
            );
          })}
        </ul>
      </section>

      {actor.userId !== detail.id ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Tài khoản</h2>
          <UserStatusButton userId={detail.id} status={detail.status} />
          {detail.activeSessions > 0 ? <RevokeAllSessionsButton userId={detail.id} /> : null}
        </section>
      ) : null}
    </main>
  );
}
