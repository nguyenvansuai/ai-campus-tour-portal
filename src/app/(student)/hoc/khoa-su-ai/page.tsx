import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CATALOG } from "@/modules/curriculum/content/catalog";
import { creditedModules, myVouchers, VOUCHER_LABELS } from "@/modules/course-integration/service";
import { getOpenEnrollment } from "@/modules/enrollment/service";
import { requireSession } from "@/modules/identity/session";
import { ClaimVoucherForm } from "@/modules/course-integration/ui/forms";

export const metadata: Metadata = { title: "Khóa Sự AI · AI Campus Tour" };

export default async function SuaiCoursePage() {
  const { user } = await requireSession();
  const row = await getOpenEnrollment(user.id);
  if (!row) redirect("/hoc");
  const [credited, vouchers] = await Promise.all([creditedModules(user.email), myVouchers(user.id)]);
  const course = CATALOG.find((c) => c.code === "N1")!;
  const has = (kind: "free_seat" | "discount") => vouchers.find((v) => v.kind === kind);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/hoc" className="text-sm text-primary">
        ← Lộ trình
      </Link>
      <h1 className="text-2xl font-bold">Khóa Sự AI (tùy chọn)</h1>
      <p>
        Đây là <strong>một trong nhiều nguồn học</strong> của lộ trình. Bạn có thể hoàn thành đầy đủ lộ trình và nhận chứng nhận chỉ với các nguồn miễn phí (N2–N11) gợi ý trong từng
        buổi.
      </p>
      <section className="flex flex-col gap-2 rounded-lg border border-border p-4 text-sm">
        <h2 className="text-base font-semibold">{course.title}</h2>
        <p>Có 2 hình thức cùng nội dung: học qua video trên suai.vn hoặc học trực tuyến trên meet.suai.vn.</p>
        <p>
          Lợi ích trên portal: học xong được <strong>miễn trắc nghiệm M2, M3</strong> (khối A/B) và M1 chỉ còn phần an toàn dữ liệu. Sản phẩm từng buổi và báo cáo module vẫn bắt
          buộc.
        </p>
        <a href={course.url} target="_blank" rel="noopener" className="font-medium text-primary">
          Xem khóa trên suai.vn →
        </a>
        <p className="text-muted-foreground">Dùng đúng email {user.email} khi đăng ký trên suai.vn để portal tự ghi nhận khi bạn học xong.</p>
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <h2 className="font-semibold">Trạng thái ghi nhận</h2>
        {credited.size ? (
          <p className="text-green-700">Đã ghi nhận học khóa Sự AI cho: {[...credited].sort().join(", ")}.</p>
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có ghi nhận. Học xong khóa video sẽ được tự cập nhật; học lớp trực tuyến thì mentor/TA xác nhận.</p>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h2 className="font-semibold">Mã ưu đãi</h2>
        {(["free_seat", "discount"] as const).map((kind) => {
          const mine = has(kind);
          if (kind === "free_seat" && !row.eventId && !mine) return null;
          return mine ? (
            <p key={kind} className="text-sm">
              {VOUCHER_LABELS[kind]}: <span className="font-mono font-semibold">{mine.code}</span>
            </p>
          ) : (
            <ClaimVoucherForm key={kind} kind={kind} label={`Nhận ${VOUCHER_LABELS[kind].toLowerCase()}`} />
          );
        })}
        <p className="text-xs text-muted-foreground">Mỗi bạn nhận tối đa 1 mã mỗi loại. Suất miễn phí dành cho SV đăng ký bằng mã workshop, số lượng có hạn.</p>
      </section>
    </main>
  );
}
