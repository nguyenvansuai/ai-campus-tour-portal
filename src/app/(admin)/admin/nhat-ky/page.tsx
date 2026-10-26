import type { Metadata } from "next";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { AUDIT_ACTION_LABELS } from "@/modules/identity/audit-labels";
import { listAuditLogs } from "@/modules/identity/service";
import { requirePermission } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Nhật ký · AI Campus Tour" };

const PAGE_SIZE = 50;
const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" });

/** Ngày dạng yyyy-mm-dd theo giờ Việt Nam → mốc thời gian. */
function parseDay(value: unknown, endOfDay: boolean) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}+07:00`);
}

export default async function AuditPage({ searchParams }: PageProps<"/admin/nhat-ky">) {
  const actor = await requirePermission("audit.view", { kind: "audit_log" });
  const params = await searchParams;
  const action = typeof params.action === "string" && params.action ? params.action : undefined;
  const actorEmail = typeof params.actor === "string" ? params.actor : "";
  const page = Math.max(1, Number(params.page) || 1);
  const result = await listAuditLogs(actor, {
    action,
    actorEmail,
    from: parseDay(params.from, false),
    to: parseDay(params.to, true),
    page,
    pageSize: PAGE_SIZE,
  });
  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const query = (target: number) =>
    `?${new URLSearchParams({ action: action ?? "", actor: actorEmail, from: String(params.from ?? ""), to: String(params.to ?? ""), page: String(target) })}`;

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Nhật ký</h1>
      <form className="grid gap-2 sm:grid-cols-5" role="search">
        <select name="action" defaultValue={action ?? ""} aria-label="Hành động" className="h-12 rounded-lg border border-border bg-background px-3">
          <option value="">Mọi hành động</option>
          {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Input name="actor" defaultValue={actorEmail} placeholder="Email người thực hiện" aria-label="Email người thực hiện" />
        <Input name="from" type="date" defaultValue={String(params.from ?? "")} aria-label="Từ ngày" />
        <Input name="to" type="date" defaultValue={String(params.to ?? "")} aria-label="Đến ngày" />
        <button type="submit" className="h-12 rounded-lg border border-border px-5 font-medium">
          Lọc
        </button>
      </form>

      <p className="text-sm text-muted-foreground">{result.total} bản ghi</p>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {result.items.map((item) => (
          <li key={item.id} className="flex flex-col gap-1 p-4">
            <span className="font-medium">{AUDIT_ACTION_LABELS[item.action] ?? item.action}</span>
            <span className="text-sm text-muted-foreground">
              {dateFormat.format(item.createdAt)} · {item.actorEmail ?? "Hệ thống"} · {item.targetType} {item.targetId ?? ""}
            </span>
            {Object.keys(item.metadata).length ? (
              <code className="text-xs break-all text-muted-foreground">{JSON.stringify(item.metadata)}</code>
            ) : null}
          </li>
        ))}
      </ul>

      {pages > 1 ? (
        <nav className="flex items-center justify-between" aria-label="Phân trang">
          {page > 1 ? <Link href={query(page - 1)}>← Trang trước</Link> : <span />}
          <span className="text-sm">
            Trang {page}/{pages}
          </span>
          {page < pages ? <Link href={query(page + 1)}>Trang sau →</Link> : <span />}
        </nav>
      ) : null}
    </main>
  );
}
