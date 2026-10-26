"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { describeAuthError, type AuthErrorLike } from "./auth-errors";

const RESEND_AFTER_SECONDS = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Result = { error: AuthErrorLike };

export type OtpSignInFormProps = {
  sendOtp: (email: string) => Promise<Result>;
  verifyOtp: (email: string, otp: string) => Promise<Result>;
  onSignedIn: () => void;
};

export function OtpSignInForm({ sendOtp, verifyOtp, onSignedIn }: OtpSignInFormProps) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function requestCode() {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      setError("Email không hợp lệ.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await sendOtp(normalized);
    setPending(false);
    if (result.error) {
      setError(describeAuthError(result.error));
      return;
    }
    setEmail(normalized);
    setCode("");
    setStep("code");
    setResendIn(RESEND_AFTER_SECONDS);
  }

  async function submitEmail(event: FormEvent) {
    event.preventDefault();
    await requestCode();
  }

  async function submitCode(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Vui lòng nhập đủ 6 số.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await verifyOtp(email, code);
    setPending(false);
    if (result.error) {
      setError(describeAuthError(result.error));
      return;
    }
    onSignedIn();
  }

  const errorMessage = error ? (
    <p role="alert" className="text-sm text-destructive">
      {error}
    </p>
  ) : null;

  if (step === "email") {
    return (
      <form onSubmit={submitEmail} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder="ban@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={error ? true : undefined}
            required
          />
        </div>
        {errorMessage}
        <Button type="submit" disabled={pending}>
          {pending ? "Đang gửi…" : "Gửi mã"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={submitCode} className="flex flex-col gap-4" noValidate>
      <p className="text-sm text-muted-foreground">
        Đã gửi mã 6 số tới <span className="font-medium text-foreground">{email}</span>. Mã có hiệu lực 10 phút.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="otp">Mã 6 số</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          className="text-center text-2xl tracking-[0.5em]"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          aria-invalid={error ? true : undefined}
          autoFocus
          required
        />
      </div>
      {errorMessage}
      <Button type="submit" disabled={pending}>
        {pending ? "Đang kiểm tra…" : "Đăng nhập"}
      </Button>
      <div className="flex items-center justify-between">
        <Button variant="link" onClick={() => { setStep("email"); setError(null); }}>
          Đổi email
        </Button>
        <Button variant="link" disabled={resendIn > 0 || pending} onClick={requestCode}>
          {resendIn > 0 ? `Gửi lại mã sau ${resendIn} giây` : "Gửi lại mã"}
        </Button>
      </div>
    </form>
  );
}
