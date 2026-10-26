import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/modules/identity/session";
import { listSchoolsForPicker } from "@/modules/org/service";
import { CreateSchoolForm } from "@/modules/org/ui/school-forms";

export const metadata: Metadata = { title: "Trường · AI Campus Tour" };

export default async function SchoolsPage() {
  await requirePermission("org.manage", { kind: "org" });
  const schools = await listSchoolsForPicker({ includePending: true });
  const pending = schools.filter((s) => s.status === "pending");

  return (
    <main className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Trường</h1>
      {pending.length ? (
        <section className="flex flex-col gap-2 rounded-lg border border-amber-500/50 p-4">
          <h2 className="font-semibold">Trường do SV tự nhập, chờ xác minh ({pending.length})</h2>
          <p className="text-sm text-muted-foreground">Xác minh nếu đúng, hoặc gộp vào trường đã có nếu trùng.</p>
        </section>
      ) : null}
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {schools.map((s) => (
          <li key={s.id}>
            <Link href={`/admin/truong/${s.id}`} className="flex flex-col gap-1 p-4 hover:bg-foreground/5">
              <span className="font-medium">
                {s.name}
                {s.shortName ? ` (${s.shortName})` : ""}
              </span>
              <span className="text-sm text-muted-foreground">
                {s.connected ? "Đã kết nối" : "Chưa kết nối"} · {s.status === "pending" ? "Chờ xác minh" : "Đã xác minh"} · {s.faculties.length} khoa
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Thêm trường</h2>
        <CreateSchoolForm />
      </section>
    </main>
  );
}
