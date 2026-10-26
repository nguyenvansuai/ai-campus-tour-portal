import type { Metadata } from "next";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS, SCOPE_LABELS } from "@/modules/identity/labels";
import { ROLES, type Role } from "@/modules/identity/policy";
import { listUsers } from "@/modules/identity/service";
import { requirePermission } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Người dùng · AI Campus Tour" };

const PAGE_SIZE = 50;

export default async function UsersPage({ searchParams }: PageProps<"/admin/nguoi-dung">) {
  const actor = await requirePermission("user.view_list", { kind: "user_admin" });
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const role = typeof params.role === "string" && (ROLES as readonly string[]).includes(params.role) ? (params.role as Role) : undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const result = await listUsers(actor, { q, role, page, pageSize: PAGE_SIZE });
  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const pageHref = (target: number) => `?${new URLSearchParams({ q, role: role ?? "", page: String(target) })}`;

  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Người dùng</h1>
        <Link href="/admin/nguoi-dung/moi" className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground">
          Mời nhân sự
        </Link>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row" role="search">
        <Input name="q" defaultValue={q} placeholder="Tìm theo email hoặc tên" aria-label="Tìm theo email hoặc tên" />
        <select name="role" defaultValue={role ?? ""} aria-label="Lọc theo vai trò" className="h-12 rounded-lg border border-border bg-background px-3">
          <option value="">Mọi vai trò</option>
          {ROLES.map((value) => (
            <option key={value} value={value}>
              {ROLE_LABELS[value]}
            </option>
          ))}
        </select>
        <button type="submit" className="h-12 rounded-lg border border-border px-5 font-medium">
          Lọc
        </button>
      </form>

      <p className="text-sm text-muted-foreground">{result.total} người dùng</p>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {result.items.map((item) => (
          <li key={item.id}>
            <Link href={`/admin/nguoi-dung/${item.id}`} className="flex flex-col gap-1 p-4 hover:bg-foreground/5">
              <span className="font-medium">
                {item.email}
                {item.status === "suspended" ? <span className="ml-2 text-sm text-destructive">(đã khóa)</span> : null}
              </span>
              {item.name ? <span className="text-sm text-muted-foreground">{item.name}</span> : null}
              <span className="text-sm">
                {item.roles.length
                  ? item.roles
                      .map((grant) => `${ROLE_LABELS[grant.role]}${grant.scopeId ? ` · ${SCOPE_LABELS[grant.scopeType]} ${grant.scopeId}` : ""}`)
                      .join(", ")
                  : "Sinh viên"}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {pages > 1 ? (
        <nav className="flex items-center justify-between" aria-label="Phân trang">
          {page > 1 ? <Link href={pageHref(page - 1)}>← Trang trước</Link> : <span />}
          <span className="text-sm">
            Trang {page}/{pages}
          </span>
          {page < pages ? <Link href={pageHref(page + 1)}>Trang sau →</Link> : <span />}
        </nav>
      ) : null}
    </main>
  );
}
