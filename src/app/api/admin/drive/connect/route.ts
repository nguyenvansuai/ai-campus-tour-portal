import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { driveConsentUrl } from "@/lib/storage/drive-oauth";
import { getActor } from "@/modules/identity/actor";
import { can } from "@/modules/identity/policy";

export async function GET() {
  const actor = await getActor(await headers());
  if (!actor || !can(actor, "system.configure", { kind: "system" })) {
    return new NextResponse("Bạn không có quyền thực hiện thao tác này.", { status: 403 });
  }
  const state = randomBytes(24).toString("base64url");
  (await cookies()).set("drive_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/api/admin/drive" });
  return NextResponse.redirect(driveConsentUrl(state));
}
