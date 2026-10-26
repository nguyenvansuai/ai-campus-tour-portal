import { describe, expect, it } from "vitest";
import { computeSchedule, vnDateOf } from "@/modules/enrollment/schedule";

// Mốc giờ Việt Nam (UTC+7)
const vn = (iso: string) => new Date(`${iso}+07:00`);

describe("computeSchedule", () => {
  const base = { startDate: "2026-11-01", extensionDays: 0, pausedDays: 0, pausedSince: null as Date | null };

  it("ngày 0 là ngày đăng ký; hạn báo cáo cuối ngày 7/14/21/28, dự án ngày 30, hạn cứng ngày 60", () => {
    const s = computeSchedule(base, vn("2026-11-01T10:00:00"));
    expect(s.dayNumber).toBe(0);
    expect(s.deadlines.M1.toISOString()).toBe(vn("2026-11-08T23:59:59.999").toISOString());
    expect(s.deadlines.M4.toISOString()).toBe(vn("2026-11-29T23:59:59.999").toISOString());
    expect(s.deadlines.final.toISOString()).toBe(vn("2026-12-01T23:59:59.999").toISOString());
    expect(s.hardDeadline.toISOString()).toBe(vn("2026-12-31T23:59:59.999").toISOString());
  });

  it("đếm ngày theo giờ Việt Nam (0h05 sáng VN đã sang ngày mới)", () => {
    expect(computeSchedule(base, vn("2026-11-02T00:05:00")).dayNumber).toBe(1);
    expect(computeSchedule(base, vn("2026-11-01T23:59:00")).dayNumber).toBe(0);
  });

  it("gia hạn 7 ngày dời mọi hạn nộp nhưng không dời hạn cứng", () => {
    const s = computeSchedule({ ...base, extensionDays: 7 }, vn("2026-11-03T10:00:00"));
    expect(s.deadlines.M1.toISOString()).toBe(vn("2026-11-15T23:59:59.999").toISOString());
    expect(s.hardDeadline.toISOString()).toBe(vn("2026-12-31T23:59:59.999").toISOString());
  });

  it("đang bảo lưu thì đồng hồ dừng; ngày bảo lưu dời hạn nộp", () => {
    const paused = computeSchedule({ ...base, pausedSince: vn("2026-11-05T09:00:00") }, vn("2026-11-10T09:00:00"));
    expect(paused.dayNumber).toBe(4);
    expect(paused.isPaused).toBe(true);
    const resumed = computeSchedule({ ...base, pausedDays: 5 }, vn("2026-11-10T09:00:00"));
    expect(resumed.dayNumber).toBe(4);
    expect(resumed.deadlines.M1.toISOString()).toBe(vn("2026-11-13T23:59:59.999").toISOString());
  });

  it("module hiện tại theo ngày học", () => {
    expect(computeSchedule(base, vn("2026-11-01T10:00:00")).currentModule).toBe("M1");
    expect(computeSchedule(base, vn("2026-11-09T10:00:00")).currentModule).toBe("M2");
    expect(computeSchedule(base, vn("2026-11-30T10:00:00")).currentModule).toBe("M5");
  });

  it("vnDateOf trả ngày theo giờ Việt Nam", () => {
    expect(vnDateOf(new Date("2026-10-31T18:30:00Z"))).toBe("2026-11-01");
  });
});
