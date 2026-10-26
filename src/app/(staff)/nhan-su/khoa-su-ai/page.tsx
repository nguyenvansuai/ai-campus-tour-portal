import type { Metadata } from "next";
import { can } from "@/modules/identity/policy";
import { requirePermission } from "@/modules/identity/session";
import { listCredits, VOUCHER_LABELS, voucherStats } from "@/modules/course-integration/service";
import { ImportVouchersForm, ManualCreditForm, RevokeCreditForm } from "@/modules/course-integration/ui/forms";

export const metadata: Metadata = { title: "Khóa Sự AI · AI Campus Tour" };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });

export default async function CourseCreditsPage({ searchParams }: PageProps<"/nhan-su/khoa-su-ai">) {
  const actor = await requirePermission("course.record", { kind: "system" });
  const email = (await searchParams).email;
  const credits = await listCredits(actor, { email: typeof email === "string" && email ? email : undefined });
  const canManageVouchers = can(actor, "course.manage_vouchers", { kind: "system" });
  const stats = canManageVouchers ? await voucherStats() : null;

  return (
    <main className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold">Khóa Sự AI (N1)</h1>
      <p className="text-sm text-muted-foreground">
        Khóa video trên suai.vn tự báo về portal khi SV hoàn thành. Lớp trên meet.suai.vn thì xác nhận tay ở đây. SV đã học được miễn trắc nghiệm M2, M3 (khối A/B); M1 chỉ còn phần an
        toàn dữ liệu. Sản phẩm và báo cáo vẫn bắt buộc.
      </p>

      <section className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <h2 className="text-lg font-semibold">Xác nhận học lớp trực tuyến</h2>
        <ManualCreditForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Đã ghi nhận</h2>
        <form className="flex gap-2">
          <input name="email" type="email" defaultValue={typeof email === "string" ? email : ""} aria-label="Tìm theo email" placeholder="Tìm theo email" className="h-10 flex-1 rounded-lg border border-border bg-background px-3" />
          <button type="submit" className="rounded-lg border border-border px-3 text-sm">
            Tìm
          </button>
        </form>
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {credits.map(({ credit, studentName }) => (
            <li key={credit.id} className="flex flex-col gap-1 p-3 text-sm">
              <span className="font-medium">
                {studentName ? `${studentName} · ` : ""}
                {credit.email}
              </span>
              <span className="text-muted-foreground">
                {credit.source === "tutor" ? `suai.vn tự báo (khóa ${credit.courseId})` : "Xác nhận tay (meet.suai.vn)"} · {credit.modules.join(", ")} · {dateFormat.format(credit.completedAt)}
                {credit.note ? ` · ${credit.note}` : ""}
              </span>
              {credit.revokedAt ? <span className="text-destructive">Đã thu hồi: {credit.revokedReason}</span> : <RevokeCreditForm creditId={credit.id} />}
            </li>
          ))}
          {credits.length === 0 ? <li className="p-3 text-muted-foreground">Chưa có ghi nhận.</li> : null}
        </ul>
      </section>

      {stats ? (
        <section className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <h2 className="text-lg font-semibold">Mã ưu đãi</h2>
          <ul className="text-sm">
            {(["free_seat", "discount"] as const).map((kind) => (
              <li key={kind}>
                {VOUCHER_LABELS[kind]}: còn {stats[kind].available}, đã phát {stats[kind].claimed}
              </li>
            ))}
          </ul>
          <ImportVouchersForm />
        </section>
      ) : null}
    </main>
  );
}
