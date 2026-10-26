"use client";

import { useRouter } from "next/navigation";
import { authClient } from "../auth-client";
import { OtpSignInForm } from "./otp-sign-in-form";

export function SignInPanel() {
  const router = useRouter();
  return (
    <OtpSignInForm
      sendOtp={(email) => authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })}
      verifyOtp={(email, otp) => authClient.signIn.emailOtp({ email, otp })}
      onSignedIn={() => {
        router.replace("/hoc");
        router.refresh();
      }}
    />
  );
}
