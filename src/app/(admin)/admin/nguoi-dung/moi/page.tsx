import type { Metadata } from "next";
import { can, ROLES } from "@/modules/identity/policy";
import { requirePermission } from "@/modules/identity/session";
import { InviteStaffForm } from "@/modules/identity/ui/invite-staff-form";
import { listScopeOptions } from "@/modules/org/service";

export const metadata: Metadata = { title: "Mời nhân sự · AI Campus Tour" };

export default async function InviteStaffPage() {
  const actor = await requirePermission("user.invite_staff", { kind: "user_admin" });
  const roles = ROLES.filter((role) => role !== "super_admin" || can(actor, "role.grant_super_admin", { kind: "user_admin" }));

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Mời nhân sự</h1>
      <p className="text-muted-foreground">
        Người được mời đăng nhập bằng đúng email này sẽ tự có vai trò. Lời mời có hiệu lực 14 ngày.
      </p>
      <InviteStaffForm roles={[...roles]} scopes={await listScopeOptions()} />
    </main>
  );
}
