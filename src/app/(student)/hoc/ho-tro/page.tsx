import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/modules/identity/session";
import { attendedSessionIds, JOIN_ERRORS, upcomingSessions, type JoinErrorCode } from "@/modules/live-sessions/service";

export const metadata: Metadata = { title: "Giờ hỗ trợ trực tuyến · AI Campus Tour" };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
const timeFormat = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });

export default async function SupportHoursPage({ searchParams }: PageProps<"/hoc/ho-tro">) {
  const { user } = await requireSession();
  const error = (await searchParams).loi;
  const [sessions, attended] = await Promise.all([upcomingSessions(), attendedSessionIds(user.id)]);
  const message = typeof error === "string" && error in JOIN_ERRORS ? JOIN_ERRORS[error as JoinErrorCode] : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/hoc" className="text-sm text-primary">
        ← Lộ trình
      </Link>
      <h1 className="text-2xl font-bold">Giờ hỗ trợ trực tuyến</h1>
      <p className="text-sm text-muted-foreground">Mentor/TA trực trên meet.suai.vn để giải đáp. Mang theo câu hỏi cụ thể hoặc màn hình đang bị vướng. Phòng mở trước giờ bắt đầu 15 phút.</p>
      {message ? (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm">
          {message}
        </p>
      ) : null}
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {sessions.map((s) => (
          <li key={s.id} className="flex flex-col gap-2 p-4">
            <span className="font-medium">{s.title}</span>
            <span className="text-sm text-muted-foreground">
              {dateFormat.format(s.startsAt)} – {timeFormat.format(s.endsAt)}
              {s.hostName ? ` · ${s.hostName}` : ""}
            </span>
            {s.note ? <span className="text-sm">{s.note}</span> : null}
            {s.joinable ? (
              <a href={`/hoc/ho-tro/${s.id}/vao`} target="_blank" rel="noopener" className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 font-medium text-primary-foreground">
                Tham gia{attended.has(s.id) ? " lại" : ""}
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">Chưa tới giờ</span>
            )}
          </li>
        ))}
        {sessions.length === 0 ? <li className="p-4 text-muted-foreground">Chưa có lịch trong 14 ngày tới.</li> : null}
      </ul>
    </main>
  );
}
