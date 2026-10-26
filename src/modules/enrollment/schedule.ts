import { MODULES } from "@/modules/curriculum/content/program";
import type { ModuleId } from "@/modules/curriculum/types";

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;
/** Hạn cứng tính từ ngày đăng ký, đã gồm gia hạn và bảo lưu. */
export const HARD_DEADLINE_DAY = 60;
export const FINAL_DAY = 30;
export const EXTENSION_DAYS = 7;
export const MAX_PAUSE_DAYS = 14;
/** Được đổi khối ngành trước ngày này. */
export const TRACK_LOCK_DAY = 15;

/** Ngày yyyy-mm-dd theo giờ Việt Nam. */
export function vnDateOf(moment: Date): string {
  return new Date(moment.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** 23:59:59.999 giờ Việt Nam của ngày (startDate + days). */
function endOfVnDay(startDate: string, days: number): Date {
  const startUtcMidnight = Date.parse(`${startDate}T00:00:00Z`);
  return new Date(startUtcMidnight + (days + 1) * DAY_MS - VN_OFFSET_MS - 1);
}

function daysBetweenVn(startDate: string, moment: Date) {
  return Math.floor((Date.parse(`${vnDateOf(moment)}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / DAY_MS);
}

export type ScheduleInput = {
  startDate: string;
  extensionDays: number;
  /** Tổng số ngày bảo lưu đã kết thúc. */
  pausedDays: number;
  /** Đang bảo lưu từ thời điểm này (null nếu không bảo lưu). */
  pausedSince: Date | null;
};

export type ReportModuleId = Exclude<ModuleId, "M0" | "M5">;

export function computeSchedule(input: ScheduleInput, now = new Date()) {
  const ongoingPause = input.pausedSince ? Math.max(0, daysBetweenVn(vnDateOf(input.pausedSince), now)) : 0;
  const shift = input.pausedDays + ongoingPause;
  const calendarDay = daysBetweenVn(input.startDate, now);
  const dayNumber = Math.max(0, calendarDay - shift);
  const offset = input.extensionDays + shift;

  const deadlines = {
    M1: endOfVnDay(input.startDate, 7 + offset),
    M2: endOfVnDay(input.startDate, 14 + offset),
    M3: endOfVnDay(input.startDate, 21 + offset),
    M4: endOfVnDay(input.startDate, 28 + offset),
    final: endOfVnDay(input.startDate, FINAL_DAY + offset),
  } satisfies Record<ReportModuleId | "final", Date>;

  // Module đầu tiên chưa hết hạn theo ngày học (bỏ qua M0 – khởi động ngay khi đăng ký).
  const currentModule: ModuleId = MODULES.find((m) => m.id !== "M0" && dayNumber <= m.endDay)?.id ?? "M5";

  return {
    dayNumber,
    calendarDay,
    isPaused: input.pausedSince !== null,
    deadlines,
    hardDeadline: endOfVnDay(input.startDate, HARD_DEADLINE_DAY),
    currentModule,
    trackLocked: dayNumber >= TRACK_LOCK_DAY,
  };
}

export type Schedule = ReturnType<typeof computeSchedule>;
