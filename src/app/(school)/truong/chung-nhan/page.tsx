import type { Metadata } from "next";
import Link from "next/link";
import { forbidden } from "next/navigation";
import { requireActor } from "@/modules/identity/session";
import { approvalQueue } from "@/modules/project-certificate/service";
import { ApproveForm } from "@/modules/project-certificate/ui/staff-forms";

export const metadata: Metadata = { title: "Duyệt chứng nhận · AI Campus Tour" };

export default async function CertificateApprovalPage({ searchParams }: PageProps<"/truong/chung-nhan">) {
  const actor = await requireActor();
  const isAdmin = actor.roles.some((r) => r.role === "admin" || r.role === "super_admin");
  const isManager = actor.roles.some((r) => r.role === "school_manager" && r.scopeType === "school");
  const isInstitute = actor.roles.some((r) => r.role === "institute_viewer");
  const roles = [...(isManager || isAdmin ? (["school"] as const) : []), ...(isInstitute || isAdmin ? (["institute"] as const) : [])];
  if (!roles.length) forbidden();
  const requested = (await searchParams).luot;
  const as = roles.find((r) => r === (requested === "vien" ? "institute" : requested === "truong" ? "school" : undefined)) ?? roles[0]!;
  const candidates = await approvalQueue(actor, as);

  return (
    <main className="flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-bold">Duyệt chứng nhận</h1>
      <p className="text-sm text-muted-foreground">
        Chỉ SV đủ điều kiện mới có trong danh sách: 12/12 buổi, 4/4 báo cáo Đạt, đạt trắc nghiệm M1–M3, dự án cuối ≥ 70 điểm. Trường đã kết nối cần cả Trường và Viện duyệt; trường khác chỉ
        cần Viện.
      </p>
      {roles.length > 1 ? (
        <nav className="flex gap-3 text-sm" aria-label="Lượt duyệt">
          <Link href="/truong/chung-nhan?luot=truong" className={as === "school" ? "font-semibold text-primary" : ""}>
            Lượt Trường
          </Link>
          <Link href="/truong/chung-nhan?luot=vien" className={as === "institute" ? "font-semibold text-primary" : ""}>
            Lượt Viện
          </Link>
        </nav>
      ) : null}
      <ApproveForm key={as} as={as} candidates={candidates} />
    </main>
  );
}
