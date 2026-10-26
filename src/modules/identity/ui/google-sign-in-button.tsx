"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { describeAuthError, type AuthErrorLike } from "./auth-errors";

export type GoogleSignInButtonProps = {
  signIn: (callbackURL: string) => Promise<{ error: AuthErrorLike }>;
};

export function GoogleSignInButton({ signIn }: GoogleSignInButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    const result = await signIn("/hoc");
    // Thành công thì trình duyệt đã chuyển sang Google; chỉ xử lý khi lỗi.
    if (result.error) {
      setPending(false);
      setError(describeAuthError(result.error));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" onClick={start} disabled={pending}>
        <svg aria-hidden viewBox="0 0 24 24" className="size-5">
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
        </svg>
        Tiếp tục với Google
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
