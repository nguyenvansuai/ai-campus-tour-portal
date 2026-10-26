import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { recordAudit } from "@/lib/audit";
import { vnDateOf } from "@/modules/enrollment/schedule";
import { getActor } from "@/modules/identity/actor";
import { listStudents, toCsv } from "@/modules/school-dashboard/service";

export async function GET(request: NextRequest) {
  const actor = await getActor(await headers());
  if (!actor || actor.roles.length === 0) return new NextResponse("Bạn không có quyền.", { status: 403 });
  const schoolId = request.nextUrl.searchParams.get("truong") || undefined;
  const status = request.nextUrl.searchParams.get("trang_thai") || undefined;
  const rows = (await listStudents(actor)).filter((r) => (!schoolId || r.schoolId === schoolId) && (!status || r.status === status));
  await recordAudit({ actorId: actor.userId, action: "report.exported", targetType: "school_report", targetId: schoolId ?? null, metadata: { rows: rows.length } });
  return new NextResponse(toCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="tien-do-sinh-vien-${vnDateOf(new Date())}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
