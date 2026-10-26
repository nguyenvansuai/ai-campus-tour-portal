import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/modules/identity/session";
import { GRADE_LABELS } from "@/modules/project-certificate/fields";
import { listIssuedCertificates } from "@/modules/project-certificate/service";
import { RevokeForm } from "@/modules/project-certificate/ui/staff-forms";

export const metadata: Metadata = { title: "Chứng nhận đã cấp · AI Campus Tour" };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });

export default async function IssuedCertificatesPage() {
  await requirePermission("certificate.revoke", { kind: "certificate" });
  const rows = (await listIssuedCertificates()).filter((c) => c.issuedAt);
  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Chứng nhận đã cấp</h1>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {rows.map((c) => (
          <li key={c.id} className="flex flex-col gap-2 p-4">
            <span className="font-medium">
              {c.studentName} · {c.schoolName} · {GRADE_LABELS[c.grade]} ({c.score} điểm)
            </span>
            <span className="text-sm text-muted-foreground">
              Mã{" "}
              <Link href={`/xac-thuc/${c.code}`} className="text-primary">
                {c.code}
              </Link>{" "}
              · cấp {dateFormat.format(c.issuedAt!)} · {c.issuers.join(" + ")}
            </span>
            {c.revokedAt ? (
              <span className="text-sm text-destructive">
                Đã thu hồi {dateFormat.format(c.revokedAt)}: {c.revokedReason}
              </span>
            ) : (
              <RevokeForm certificateId={c.id} />
            )}
          </li>
        ))}
        {rows.length === 0 ? <li className="p-4 text-muted-foreground">Chưa cấp chứng nhận nào.</li> : null}
      </ul>
    </main>
  );
}
