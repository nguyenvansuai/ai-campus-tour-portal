import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { ForbiddenError } from "@/modules/identity/policy";
import { signJitsiToken } from "@/modules/live-sessions/jitsi";
import { sessionAttendance, supportSession } from "@/modules/live-sessions/schema";
import { attendanceOf, cancelSession, createSessions, joinSession, parseVnDateTime, sessionsForStaff, upcomingSessions } from "@/modules/live-sessions/service";
import { resetDatabase } from "../../setup/reset";
import { signIn, staffActor } from "../identity/helpers";
import { enrolledStudent } from "../learning/helpers";
import { loadActor } from "@/modules/identity/actor";

beforeEach(resetDatabase);
afterAll(closeDb);

/** Giờ Việt Nam dạng datetime-local, cách hiện tại `minutes` phút. */
function vnLocal(minutes: number) {
  return new Date(Date.now() + minutes * 60_000 + 7 * 3_600_000).toISOString().slice(0, 16);
}

describe("Giờ hỗ trợ", () => {
  it("đổi giờ Việt Nam đúng", () => {
    expect(parseVnDateTime("2026-11-03T19:30")?.toISOString()).toBe("2026-11-03T12:30:00.000Z");
    expect(parseVnDateTime("abc")).toBeNull();
  });

  it("mentor tạo buổi lặp tuần, tên phòng khó đoán; SV không tạo được", async () => {
    const mentor = await staffActor("mentor@example.com", "mentor");
    expect(await createSessions(mentor, { title: "Hỏi đáp tối thứ 3", startsAt: vnLocal(60), durationMinutes: 60, note: "", repeatWeeks: 3 })).toBe(3);
    const rows = await db.select().from(supportSession);
    expect(new Set(rows.map((r) => r.room)).size).toBe(3);
    expect(rows[0]?.room).toMatch(/^aict-ho-tro-[0-9a-f]{12}$/);
    await expect(createSessions(mentor, { title: "Sai", startsAt: vnLocal(60), durationMinutes: 10, note: "", repeatWeeks: 1 })).rejects.toThrow(/30 đến 180/);
    const sv = await enrolledStudent();
    await expect(createSessions(sv.actor, { title: "SV tự tạo", startsAt: vnLocal(60), durationMinutes: 60, note: "", repeatWeeks: 1 })).rejects.toThrow(ForbiddenError);
  });

  it("SV vào trong giờ: ghi điểm danh 1 lần; chưa tới giờ / đã hủy thì không vào được", async () => {
    const mentor = await staffActor("mentor@example.com", "mentor");
    await createSessions(mentor, { title: "Đang diễn ra", startsAt: vnLocal(5), durationMinutes: 60, note: "", repeatWeeks: 2 });
    const [now, later] = (await db.select().from(supportSession)).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    const sv = await enrolledStudent();
    const profile = { name: "Sinh Viên Thử", email: "sv@example.com" };

    const url = await joinSession(sv.actor, profile, now!.id);
    expect(url).toContain(`https://meet.suai.vn/${now!.room}`);
    expect(url).not.toContain("jwt=");
    await joinSession(sv.actor, profile, now!.id);
    expect(await db.select().from(sessionAttendance)).toHaveLength(1);
    expect((await attendanceOf(mentor, now!.id))[0]).toMatchObject({ email: "sv@example.com" });
    expect((await sessionsForStaff(mentor)).find((s) => s.id === now!.id)?.attendees).toBe(1);

    await expect(joinSession(sv.actor, profile, later!.id)).rejects.toMatchObject({ code: "chua-mo" });
    await cancelSession(mentor, now!.id);
    await expect(joinSession(sv.actor, profile, now!.id)).rejects.toMatchObject({ code: "huy" });
    expect((await upcomingSessions()).map((s) => s.id)).toEqual([later!.id]);
  });

  it("người không phải SV đang học và không phải nhân sự thì không vào", async () => {
    const mentor = await staffActor("mentor@example.com", "mentor");
    await createSessions(mentor, { title: "Hỏi đáp", startsAt: vnLocal(0), durationMinutes: 60, note: "", repeatWeeks: 1 });
    const [session] = await db.select().from(supportSession);
    const { userId } = await signIn("nguoi-la@example.com");
    const stranger = (await loadActor(userId))!;
    await expect(joinSession(stranger, { name: "", email: "nguoi-la@example.com" }, session!.id)).rejects.toMatchObject({ code: "khong-phai-sv" });
  });

  it("JWT Jitsi đúng cấu trúc và chữ ký", () => {
    const token = signJitsiToken({
      appId: "aict",
      secret: "s".repeat(32),
      domain: "meet.suai.vn",
      room: "aict-ho-tro-abc",
      user: { id: "u1", name: "Mentor", email: "m@example.com", moderator: true },
      expiresAt: new Date("2026-11-03T14:00:00Z"),
      now: new Date("2026-11-03T12:00:00Z"),
    });
    const [header, payload, signature] = token.split(".");
    expect(JSON.parse(Buffer.from(header!, "base64url").toString())).toEqual({ alg: "HS256", typ: "JWT" });
    expect(JSON.parse(Buffer.from(payload!, "base64url").toString())).toMatchObject({
      aud: "jitsi",
      iss: "aict",
      sub: "meet.suai.vn",
      room: "aict-ho-tro-abc",
      exp: 1793714400,
      moderator: true,
      context: { user: { name: "Mentor", moderator: true } },
    });
    expect(signature).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});
