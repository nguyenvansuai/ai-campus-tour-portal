import Link from "next/link";
import { forbidden } from "next/navigation";
import { requireActor } from "@/modules/identity/session";
import { SignOutButton } from "@/modules/identity/ui/sign-out-button";

export default async function SchoolLayout({ children }: LayoutProps<"/truong">) {
  const actor = await requireActor();
  if (actor.roles.length === 0) forbidden();
  const canApprove = actor.roles.some((r) => ["admin", "super_admin", "institute_viewer"].includes(r.role) || (r.role === "school_manager" && r.scopeType === "school"));
  return (
    <>
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2" aria-label="Điều hướng">
          <Link href="/truong" className="font-bold">
            Tiến độ sinh viên
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {canApprove ? <Link href="/truong/chung-nhan">Duyệt chứng nhận</Link> : null}
            <SignOutButton compact />
          </div>
        </nav>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">{children}</div>
    </>
  );
}
