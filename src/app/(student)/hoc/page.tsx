import type { Metadata } from "next";
import { requireSession } from "@/modules/identity/session";
import { SignOutButton } from "@/modules/identity/ui/sign-out-button";

export const metadata: Metadata = { title: "Lộ trình của tôi · AI Campus Tour" };

export default async function StudentHomePage() {
  const { user } = await requireSession();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold">Xin chào, {user.name || user.email}</h1>
      <p className="text-muted-foreground">Lộ trình 30 ngày của bạn sẽ hiện ở đây.</p>
      <SignOutButton />
    </main>
  );
}
