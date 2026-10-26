import Link from "next/link";
import { forbidden } from "next/navigation";
import { requireActor } from "@/modules/identity/session";
import { SignOutButton } from "@/modules/identity/ui/sign-out-button";

const STAFF_ROLES = new Set(["super_admin", "admin", "mentor", "ta"]);

export default async function StaffLayout({ children }: LayoutProps<"/nhan-su">) {
  const actor = await requireActor();
  if (!actor.roles.some((r) => STAFF_ROLES.has(r.role))) forbidden();
  const isAdmin = actor.roles.some((r) => r.role === "admin" || r.role === "super_admin");
  return (
    <>
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2" aria-label="Điều hướng nhân sự">
          <Link href="/nhan-su" className="font-bold">
            Chấm bài
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/nhan-su/du-an">Dự án cuối</Link>
            <Link href="/nhan-su/khoa-su-ai">Khóa Sự AI</Link>
            <Link href="/nhan-su/ho-tro">Giờ hỗ trợ</Link>
            <Link href="/truong">Tiến độ SV</Link>
            {isAdmin ? <Link href="/admin">Quản trị</Link> : null}
            <SignOutButton compact />
          </div>
        </nav>
      </header>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">{children}</div>
    </>
  );
}
