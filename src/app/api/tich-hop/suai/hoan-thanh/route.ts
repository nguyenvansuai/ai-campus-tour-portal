import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { recordTutorCompletion, verifyBridgeSignature } from "@/modules/course-integration/service";

/** suai.vn (plugin aict-bridge) báo SV đã hoàn thành khóa Sự AI. Ký HMAC, xem SPEC-course-integration.md. */
export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > 10_000) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  if (!verifyBridgeSignature(body, request.headers.get("x-aict-timestamp"), request.headers.get("x-aict-signature"))) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }
  try {
    return NextResponse.json(await recordTutorCompletion(JSON.parse(body)));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    throw error;
  }
}
