import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.stubEnv("DATABASE_URL", "postgres://x/y");
  vi.stubEnv("APP_URL", "https://aicampustour.suai.vn");
  vi.stubEnv("BETTER_AUTH_SECRET", "x".repeat(32));
  vi.stubEnv("GOOGLE_CLIENT_ID", "cid");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "csec");
});

describe("Google Drive OAuth", () => {
  it("URL xin quyền: chỉ drive.file, lấy refresh token, đúng redirect URI", async () => {
    const { driveConsentUrl } = await import("@/lib/storage/drive-oauth");
    const url = new URL(driveConsentUrl("st"));
    expect(url.searchParams.get("scope")).toBe("openid email https://www.googleapis.com/auth/drive.file");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("redirect_uri")).toBe("https://aicampustour.suai.vn/api/admin/drive/callback");
    expect(url.searchParams.get("state")).toBe("st");
    // Không gộp quyền cũ (YouTube của suai.vn) vào yêu cầu Drive.
    expect(url.searchParams.has("include_granted_scopes")).toBe(false);
  });

  it("đổi mã lấy refresh token và email", async () => {
    const { exchangeDriveCode } = await import("@/lib/storage/drive-oauth");
    const idToken = `h.${Buffer.from(JSON.stringify({ email: "nguyenvansutt@gmail.com" })).toString("base64url")}.s`;
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ refresh_token: "rt", id_token: idToken, scope: "openid email https://www.googleapis.com/auth/drive.file" })));
    expect(await exchangeDriveCode("code", fetchImpl as never)).toEqual({ refreshToken: "rt", email: "nguyenvansutt@gmail.com" });
  });

  it("báo lỗi khi người dùng không cấp quyền Drive", async () => {
    const { exchangeDriveCode } = await import("@/lib/storage/drive-oauth");
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ refresh_token: "rt", scope: "openid email" })));
    await expect(exchangeDriveCode("code", fetchImpl as never)).rejects.toThrow(/chưa cấp quyền Google Drive/);
  });
});
