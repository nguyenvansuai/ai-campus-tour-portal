import type { Metadata } from "next";
import { env } from "@/lib/env";
import { requirePermission } from "@/modules/identity/session";
import { listEventsWithCodes, listSchoolsForPicker } from "@/modules/org/service";
import { CreateCodeForm, CreateEventForm } from "@/modules/org/ui/school-forms";

export const metadata: Metadata = { title: "Sự kiện workshop · AI Campus Tour" };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });

export default async function EventsPage() {
  const actor = await requirePermission("org.manage", { kind: "org" });
  const [events, schools] = await Promise.all([listEventsWithCodes(actor), listSchoolsForPicker()]);
  const appUrl = env().APP_URL;

  return (
    <main className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Sự kiện workshop và mã kích hoạt</h1>
      {events.map((e) => (
        <section key={e.id} className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h2 className="font-semibold">{e.name}</h2>
          <p className="text-sm text-muted-foreground">
            {e.schoolName} · {e.heldOn}
          </p>
          <ul className="flex flex-col gap-2">
            {e.codes.map((c) => (
              <li key={c.id} className="flex flex-col gap-1 rounded-md bg-foreground/5 p-3">
                <span className="font-mono text-xl font-bold tracking-widest">{c.code}</span>
                <span className="text-sm break-all">
                  Link đăng ký (tạo QR từ link này): {appUrl}/bat-dau?ma={c.code}
                </span>
                <span className="text-sm text-muted-foreground">
                  Đã dùng {c.usedCount}/{c.maxUses} · Hết hạn {dateFormat.format(c.expiresAt)}
                </span>
              </li>
            ))}
          </ul>
          <CreateCodeForm eventId={e.id} />
        </section>
      ))}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Tạo sự kiện mới</h2>
        <CreateEventForm schools={schools.map(({ id, name }) => ({ id, name }))} />
      </section>
    </main>
  );
}
