import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/modules/identity/session";
import { listSchoolsForPicker } from "@/modules/org/service";
import { AddClassForm, AddFacultyForm, EditSchoolForm, MergeSchoolForm } from "@/modules/org/ui/school-forms";

export const metadata: Metadata = { title: "Chi tiết trường · AI Campus Tour" };

export default async function SchoolDetailPage({ params }: PageProps<"/admin/truong/[id]">) {
  await requirePermission("org.manage", { kind: "org" });
  const { id } = await params;
  const schools = await listSchoolsForPicker({ includePending: true });
  const current = schools.find((s) => s.id === id);
  if (!current) notFound();

  return (
    <main className="flex flex-col gap-8">
      <Link href="/admin/truong" className="text-sm text-primary">
        ← Trường
      </Link>
      <h1 className="text-2xl font-bold">{current.name}</h1>
      <EditSchoolForm school={current} />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Khoa và lớp</h2>
        {current.faculties.map((f) => (
          <div key={f.id} className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <h3 className="font-medium">{f.name}</h3>
            <p className="text-sm text-muted-foreground">{f.classes.length ? f.classes.map((c) => c.name).join(", ") : "Chưa có lớp"}</p>
            <AddClassForm facultyId={f.id} />
          </div>
        ))}
        <AddFacultyForm schoolId={current.id} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Gộp trường trùng</h2>
        <MergeSchoolForm removeId={current.id} candidates={schools.filter((s) => s.id !== current.id).map(({ id: sid, name }) => ({ id: sid, name }))} />
      </section>
    </main>
  );
}
