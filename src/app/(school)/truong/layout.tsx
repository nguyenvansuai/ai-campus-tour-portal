import { forbidden } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { requireActor } from "@/modules/identity/session";

export default async function SchoolLayout({ children }: LayoutProps<"/truong">) {
  const actor = await requireActor();
  if (actor.roles.length === 0) forbidden();
  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">{children}</div>
    </AppShell>
  );
}
