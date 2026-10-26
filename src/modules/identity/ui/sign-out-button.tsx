"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "../auth-client";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  return (
    <Button
      variant={compact ? "link" : "outline"}
      className={compact ? "h-auto text-sm" : undefined}
      onClick={async () => {
        await authClient.signOut();
        router.replace("/dang-nhap");
        router.refresh();
      }}
    >
      Đăng xuất
    </Button>
  );
}
