import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { recordAudit } from "@/lib/audit";
import { env } from "@/lib/env";
import { setSecretSetting } from "@/lib/settings";
import { DRIVE_ACCOUNT_SETTING, DRIVE_TOKEN_SETTING } from "@/lib/storage";
import { exchangeDriveCode } from "@/lib/storage/drive-oauth";
import { getActor } from "@/modules/identity/actor";
import { can } from "@/modules/identity/policy";

export async function GET(request: NextRequest) {
  const actor = await getActor(await headers());
  if (!actor || !can(actor, "system.configure", { kind: "system" })) {
    return new NextResponse("Bạn không có quyền thực hiện thao tác này.", { status: 403 });
  }
  const back = (query: string) => NextResponse.redirect(`${env().APP_URL}/admin/luu-tru?${query}`);
  const store = await cookies();
  const expected = store.get("drive_oauth_state")?.value;
  store.delete({ name: "drive_oauth_state", path: "/api/admin/drive" });
  const params = request.nextUrl.searchParams;
  if (!expected || params.get("state") !== expected) return back("loi=state");
  const code = params.get("code");
  if (!code) return back("loi=huy");
  try {
    const { refreshToken, email } = await exchangeDriveCode(code);
    await setSecretSetting(DRIVE_TOKEN_SETTING, refreshToken, actor.userId);
    await setSecretSetting(DRIVE_ACCOUNT_SETTING, email ?? "(không rõ)", actor.userId);
    await recordAudit({ actorId: actor.userId, action: "system.drive_connected", targetType: "system", targetId: "google_drive", metadata: { email } });
    return back("ok=1");
  } catch (error) {
    return back(`loi=${encodeURIComponent(error instanceof Error ? error.message : "Không kết nối được.")}`);
  }
}
