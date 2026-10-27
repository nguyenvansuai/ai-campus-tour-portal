import { forbidden } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { requireActor } from "@/modules/identity/session";

const STAFF_ROLES = new Set(["super_admin", "admin", "mentor", "ta"]);

export default async function StaffLayout({ children }: LayoutProps<"/nhan-su">) {
  const actor = await requireActor();
  if (!actor.roles.some((r) => STAFF_ROLES.has(r.role))) forbidden();
  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">{children}</div>
    </AppShell>
  );
}
