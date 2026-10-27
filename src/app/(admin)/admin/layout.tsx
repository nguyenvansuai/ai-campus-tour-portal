import { AppShell } from "@/components/shell/app-shell";
import { requirePermission } from "@/modules/identity/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requirePermission("user.view_list", { kind: "user_admin" });
  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">{children}</div>
    </AppShell>
  );
}
