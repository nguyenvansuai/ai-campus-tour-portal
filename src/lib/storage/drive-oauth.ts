import { env } from "@/lib/env";

export const DRIVE_SCOPES = ["openid", "email", "https://www.googleapis.com/auth/drive.file"];

export function driveRedirectUri() {
  return `${env().APP_URL}/api/admin/drive/callback`;
}

export function driveConsentUrl(state: string) {
  const params = new URLSearchParams({
    client_id: env().GOOGLE_CLIENT_ID ?? "",
    redirect_uri: driveRedirectUri(),
    response_type: "code",
    scope: DRIVE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Đổi mã từ Google lấy refresh token và email tài khoản Google đã cấp quyền. */
export async function exchangeDriveCode(code: string, fetchImpl: typeof fetch = fetch) {
  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env().GOOGLE_CLIENT_ID ?? "",
      client_secret: env().GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: driveRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) throw new Error(`Google từ chối mã xác thực (HTTP ${response.status}).`);
  const body = (await response.json()) as { refresh_token?: string; id_token?: string; scope?: string };
  if (!body.refresh_token) throw new Error("Google không trả refresh token. Hãy thử kết nối lại (cần đồng ý cấp quyền).");
  if (!body.scope?.includes("drive.file")) throw new Error("Bạn chưa cấp quyền Google Drive. Hãy thử lại và tick ô cho phép.");
  let email: string | null = null;
  if (body.id_token) {
    const payload = JSON.parse(Buffer.from(body.id_token.split(".")[1] ?? "", "base64url").toString("utf8")) as { email?: string };
    email = payload.email ?? null;
  }
  return { refreshToken: body.refresh_token, email };
}
