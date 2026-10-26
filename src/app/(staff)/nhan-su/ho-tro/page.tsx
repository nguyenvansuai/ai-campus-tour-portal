import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/modules/identity/session";
import { sessionsForStaff } from "@/modules/live-sessions/service";
import { CancelSessionForm, CreateSessionForm } from "@/modules/live-sessions/ui/forms";

export const metadata: Metadata = { title: "Giờ hỗ trợ · AI Campus Tour" };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });

export default async function StaffSupportHoursPage() {
  const actor = await requirePermission("live_session.manage", { kind: "system" });
  const sessions = await sessionsForStaff(actor);
  const now = new Date();
  return (
    <main className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold">Giờ hỗ trợ trên meet.suai.vn</h1>
      <section className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <h2 className="text-lg font-semibold">Tạo buổi</h2>
        <CreateSessionForm />
      </section>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {sessions.map((s) => (
          <li key={s.id} className="flex flex-col gap-2 p-4">
            <span className="font-medium">
              {s.title}
              {s.cancelledAt ? <span className="ml-2 text-destructive">(đã hủy)</span> : null}
            </span>
            <span className="text-sm text-muted-foreground">
              {dateFormat.format(s.startsAt)} · {s.durationMinutes} phút{s.hostName ? ` · ${s.hostName}` : ""} ·{" "}
              <Link href={`/nhan-su/ho-tro/${s.id}`} className="text-primary">
                {s.attendees} người tham gia
              </Link>
            </span>
            {!s.cancelledAt && s.endsAt > now ? (
              <div className="flex flex-wrap items-start gap-3">
                <a href={`/hoc/ho-tro/${s.id}/vao`} target="_blank" rel="noopener" className="inline-flex h-10 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
                  Vào phòng (chủ trì)
                </a>
                <CancelSessionForm sessionId={s.id} />
              </div>
            ) : null}
          </li>
        ))}
        {sessions.length === 0 ? <li className="p-4 text-muted-foreground">Chưa có buổi nào.</li> : null}
      </ul>
    </main>
  );
}
