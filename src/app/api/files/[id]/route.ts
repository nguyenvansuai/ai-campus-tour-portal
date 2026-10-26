import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getActor } from "@/modules/identity/actor";
import { ForbiddenError } from "@/modules/identity/policy";
import { LearningError, readFileForViewer } from "@/modules/learning/service";
import { readFinalPdfForSecondReviewer } from "@/modules/project-certificate/service";

async function readFile(actor: Parameters<typeof readFileForViewer>[0], id: string) {
  try {
    return await readFileForViewer(actor, id);
  } catch (error) {
    if (error instanceof ForbiddenError) return readFinalPdfForSecondReviewer(actor, id);
    throw error;
  }
}

export async function GET(_request: Request, { params }: RouteContext<"/api/files/[id]">) {
  const actor = await getActor(await headers());
  if (!actor) return new NextResponse("Vui lòng đăng nhập.", { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Không tìm thấy file.", { status: 404 });
  try {
    const file = await readFile(actor, id);
    return new NextResponse(Buffer.from(file.bytes), {
      headers: {
        "content-type": file.type,
        "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ForbiddenError) return new NextResponse("Bạn không có quyền xem file này.", { status: 403 });
    if (error instanceof LearningError) return new NextResponse(error.message, { status: 404 });
    throw error;
  }
}
