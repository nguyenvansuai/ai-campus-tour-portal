import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getCurrentSession } from "@/modules/identity/session";
import { joinSession, LiveSessionError } from "@/modules/live-sessions/service";

/** Kiểm tra quyền vào, ghi điểm danh rồi chuyển sang phòng Jitsi. */
export async function GET(_request: Request, { params }: RouteContext<"/hoc/ho-tro/[id]/vao">) {
  const { id } = await params;
  const base = env().APP_URL;
  const current = await getCurrentSession();
  if (!current) return NextResponse.redirect(`${base}/dang-nhap?next=${encodeURIComponent(`/hoc/ho-tro/${id}/vao`)}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(`${base}/hoc/ho-tro?loi=huy`);
  try {
    const url = await joinSession(current.actor, { name: current.user.name, email: current.user.email }, id);
    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof LiveSessionError && error.code) return NextResponse.redirect(`${base}/hoc/ho-tro?loi=${error.code}`);
    throw error;
  }
}
