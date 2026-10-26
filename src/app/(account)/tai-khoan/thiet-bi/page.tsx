import type { Metadata } from "next";
import { listMySessions } from "@/modules/identity/service";
import { requireSession } from "@/modules/identity/session";
import { RevokeMySessionButton } from "@/modules/identity/ui/manage-buttons";

export const metadata: Metadata = { title: "Thiết bị đăng nhập · AI Campus Tour" };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });

/** Rút gọn User-Agent thành tên thiết bị dễ đọc. */
function describeDevice(userAgent: string | null) {
  if (!userAgent) return "Thiết bị không rõ";
  const os = /iPhone|iPad/.test(userAgent) ? "iPhone/iPad" : /Android/.test(userAgent) ? "Android" : /Windows/.test(userAgent) ? "Windows" : /Mac OS/.test(userAgent) ? "Mac" : "Máy tính";
  const browser = /Edg\//.test(userAgent) ? "Edge" : /Chrome\//.test(userAgent) ? "Chrome" : /Safari\//.test(userAgent) ? "Safari" : /Firefox\//.test(userAgent) ? "Firefox" : "Trình duyệt";
  return `${browser} trên ${os}`;
}

export default async function DevicesPage() {
  const current = await requireSession();
  const devices = await listMySessions(current.actor, current.session.id);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold">Thiết bị đang đăng nhập</h1>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {devices.map((device) => (
          <li key={device.id} className="flex items-center justify-between gap-3 p-4">
            <div className="flex flex-col">
              <span className="font-medium">
                {describeDevice(device.userAgent)}
                {device.current ? <span className="ml-2 text-sm text-green-700">(thiết bị này)</span> : null}
              </span>
              <span className="text-sm text-muted-foreground">Dùng gần nhất: {dateFormat.format(device.updatedAt)}</span>
            </div>
            {device.current ? null : <RevokeMySessionButton sessionId={device.id} />}
          </li>
        ))}
      </ul>
    </main>
  );
}
