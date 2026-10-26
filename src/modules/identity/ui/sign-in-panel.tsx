"use client";

import { useRouter } from "next/navigation";
import { authClient } from "../auth-client";
import { GoogleSignInButton } from "./google-sign-in-button";
import { OtpSignInForm } from "./otp-sign-in-form";

export function SignInPanel({ googleEnabled, next = "/hoc" }: { googleEnabled: boolean; next?: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      {googleEnabled ? (
        <>
          <GoogleSignInButton signIn={(callbackURL) => authClient.signIn.social({ provider: "google", callbackURL: next || callbackURL })} />
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            hoặc nhận mã qua email
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}
      <OtpSignInForm
      sendOtp={(email) => authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })}
      verifyOtp={(email, otp) => authClient.signIn.emailOtp({ email, otp })}
      onSignedIn={() => {
        router.replace(next);
        router.refresh();
      }}
      />
    </div>
  );
}
