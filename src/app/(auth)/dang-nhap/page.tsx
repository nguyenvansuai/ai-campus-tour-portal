import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/modules/identity/session";
import { SignInPanel } from "@/modules/identity/ui/sign-in-panel";

export const metadata: Metadata = { title: "Đăng nhập · AI Campus Tour" };

export default async function SignInPage() {
  if (await getCurrentSession()) redirect("/hoc");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Đăng nhập</h1>
        <p className="text-sm text-muted-foreground">Nhập email, chúng tôi sẽ gửi mã 6 số để bạn đăng nhập. Không cần mật khẩu.</p>
      </div>
      <SignInPanel />
    </main>
  );
}
