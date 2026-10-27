import type { ReactNode } from "react";
import { LESSONS } from "@/modules/curriculum/content/program";
import { getLatestEnrollment, getOpenEnrollment, scheduleOf } from "@/modules/enrollment/service";
import { ROLE_LABELS } from "@/modules/identity/labels";
import { getCurrentSession } from "@/modules/identity/session";
import { getProgress } from "@/modules/learning/service";
import { buildNav } from "./nav";
import { ShellFrame, type StudentProgress } from "./shell-frame";

/** Khung chung cho mọi trang sau đăng nhập: menu bên trái theo vai trò, thanh trên cùng, ô tiến trình học của SV. */
export async function AppShell({ children }: { children: ReactNode }) {
  const current = await getCurrentSession();
  // Chưa đăng nhập: để trang tự chuyển hướng (giữ tham số ?next=).
  if (!current) return <>{children}</>;
  const { actor, user } = current;

  const open = await getOpenEnrollment(user.id);
  const isStudent = Boolean(open) || actor.roles.length === 0 || Boolean(await getLatestEnrollment(user.id));
  let progress: StudentProgress | null = null;
  if (open) {
    const data = await getProgress(open.id);
    const schedule = scheduleOf(open);
    const next = LESSONS.find((l) => data.unlocked[l.moduleId] && !data.completedLessons.has(l.number));
    progress = {
      day: schedule.dayNumber,
      lessonsDone: data.completedLessons.size,
      lessonsTotal: LESSONS.length,
      next: next ? { href: `/hoc/buoi/${next.number}`, label: `Buổi ${next.number}` } : null,
      paused: schedule.isPaused,
    };
  }

  const roleLabel = actor.roles.length ? [...new Set(actor.roles.map((r) => ROLE_LABELS[r.role]))].join(", ") : "Sinh viên";
  return (
    <ShellFrame
      sections={buildNav(actor, { isStudent })}
      userName={user.name || user.email}
      roleLabel={roleLabel}
      progress={progress}
      // Thanh dưới cùng trên điện thoại cho SV đang học: 3 mục hay dùng nhất + nút mở menu đầy đủ.
      quickLinks={
        open
          ? [
              { href: "/hoc", label: "Lộ trình", icon: "home" },
              { href: "/hoc/du-an", label: "Dự án", icon: "trophy" },
              { href: "/hoc/ho-tro", label: "Hỗ trợ", icon: "video" },
            ]
          : []
      }
    >
      {children}
    </ShellFrame>
  );
}
