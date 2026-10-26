import Link from "next/link";
import { SignOutButton } from "@/modules/identity/ui/sign-out-button";

export default function StudentLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2" aria-label="Điều hướng chính">
          <Link href="/hoc" className="font-bold">
            AI Campus Tour
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/tai-khoan/thiet-bi" className="text-muted-foreground">
              Tài khoản
            </Link>
            <SignOutButton compact />
          </div>
        </nav>
      </header>
      {children}
    </>
  );
}
