import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/modules/identity/session";
import { attendanceOf } from "@/modules/live-sessions/service";

export const metadata: Metadata = { title: "Điểm danh giờ hỗ trợ · AI Campus Tour" };

const timeFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });

export default async function AttendancePage({ params }: PageProps<"/nhan-su/ho-tro/[id]">) {
  const actor = await requirePermission("live_session.manage", { kind: "system" });
  const rows = await attendanceOf(actor, (await params).id);
  return (
    <main className="flex max-w-3xl flex-col gap-4">
      <Link href="/nhan-su/ho-tro" className="text-sm text-primary">
        ← Giờ hỗ trợ
      </Link>
      <h1 className="text-2xl font-bold">Điểm danh ({rows.length})</h1>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {rows.map((r) => (
          <li key={r.email} className="p-3 text-sm">
            {r.name || r.email} · {r.email} · vào lúc {timeFormat.format(r.joinedAt)}
          </li>
        ))}
        {rows.length === 0 ? <li className="p-3 text-muted-foreground">Chưa có ai tham gia.</li> : null}
      </ul>
    </main>
  );
}
