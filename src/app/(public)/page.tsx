import Image from "next/image";
import Link from "next/link";
import { FounderCard } from "@/components/brand/founder-card";

const STEPS = [
  { title: "Đăng ký miễn phí", text: "Đăng nhập bằng email, chọn khối ngành và mục tiêu nghề. Lộ trình 30 ngày tính từ ngày bạn đăng ký." },
  { title: "Học 12 buổi theo module", text: "Mỗi buổi 45–60 phút, có hướng dẫn học ở đâu (ưu tiên nguồn miễn phí) và sản phẩm cần nộp." },
  { title: "Mentor chấm và góp ý", text: "Cuối mỗi tuần nộp báo cáo module. Mentor, trợ giảng phản hồi trong 3 ngày và có giờ hỗ trợ trực tuyến." },
  { title: "Dự án cuối và chứng nhận", text: "Giải 1 bài toán thật của ngành bằng AI. Đạt từ 70 điểm được cấp chứng nhận có mã QR xác thực." },
];

const MODULES = [
  { id: "M1", title: "Nền tảng AI", days: "Ngày 1–7" },
  { id: "M2", title: "Dùng AI để xin việc", days: "Ngày 8–14" },
  { id: "M3", title: "Workflow AI theo khối ngành", days: "Ngày 15–21" },
  { id: "M4", title: "Dự án và hồ sơ năng lực", days: "Ngày 22–28" },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Phần mở đầu */}
      <section className="border-b border-border bg-gradient-to-b from-primary/10 to-background">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-12 text-center sm:py-16">
          <div className="flex items-center gap-4">
            <Image src="/brand/vien-dtbk-logo.webp" alt="Viện Đào tạo Bách Khoa" width={320} height={320} unoptimized className="size-16 sm:size-20" />
            <span className="h-10 w-px bg-border" aria-hidden />
            <Image src="/brand/suai-logo.png" alt="Logo Sự AI" width={543} height={231} unoptimized className="h-9 w-auto sm:h-11" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">AI Campus Tour</h1>
            <p className="text-sm font-medium text-muted-foreground">Sáng lập bởi Sự AI</p>
          </div>
          <p className="max-w-2xl text-lg leading-8">
            Lộ trình <strong>30 ngày tự học AI ứng dụng</strong> cho sinh viên đại học: học theo khối ngành, làm sản phẩm thật, có mentor đồng hành và chứng nhận khi hoàn thành.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/dang-nhap"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Bắt đầu học
            </Link>
            <Link href="/xac-thuc" className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-6 font-medium transition-colors hover:bg-foreground/5">
              Xác thực chứng nhận
            </Link>
          </div>
          <ul className="grid w-full max-w-3xl grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
            {[
              ["30 ngày", "lộ trình cá nhân"],
              ["12 buổi", "học + sản phẩm"],
              ["Miễn phí", "cho sinh viên"],
              ["Chứng nhận", "có mã QR"],
            ].map(([value, label]) => (
              <li key={value} className="rounded-xl border border-border bg-background p-3">
                <p className="text-lg font-bold text-primary">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cách học */}
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Học như thế nào</h2>
          <p className="text-muted-foreground">Không cần nền tảng lập trình. Mỗi tuần khoảng 3–4 giờ, học trên điện thoại hoặc máy tính.</p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2 rounded-xl border border-border p-5">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</span>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
        <ul className="grid gap-3 sm:grid-cols-2">
          {MODULES.map((m) => (
            <li key={m.id} className="flex items-center gap-4 rounded-xl bg-foreground/[0.03] p-4">
              <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-bold text-primary">{m.id}</span>
              <span className="flex flex-col">
                <span className="font-medium">{m.title}</span>
                <span className="text-xs text-muted-foreground">{m.days}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Đơn vị cấp chứng nhận */}
      <section className="border-y border-border bg-foreground/[0.02]">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-12 sm:flex-row sm:gap-10">
          <Image src="/brand/vien-dtbk-logo.webp" alt="Logo Viện Đào tạo Bách Khoa" width={320} height={320} unoptimized className="size-32 shrink-0 sm:size-40" />
          <div className="flex flex-col gap-3 text-center sm:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Đơn vị cấp chứng nhận</p>
            <h2 className="text-2xl font-bold">Viện Đào tạo Bách Khoa</h2>
            <p className="leading-7 text-muted-foreground">
              Sinh viên hoàn thành lộ trình được Viện Đào tạo Bách Khoa cấp chứng nhận. Với các trường đã kết nối chương trình, chứng nhận do <strong>Trường và Viện</strong> cùng cấp.
              Mỗi chứng nhận có mã và QR để nhà tuyển dụng xác thực trực tuyến.
            </p>
          </div>
        </div>
      </section>

      {/* Người sáng lập */}
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
        <FounderCard />
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-10 text-center text-primary-foreground">
          <h2 className="text-2xl font-bold">Sẵn sàng bắt đầu 30 ngày?</h2>
          <p className="max-w-xl opacity-90">Đăng ký bằng email sinh viên hoặc Gmail. Có mã workshop thì nhập ở bước đăng ký để vào đúng trường.</p>
          <Link href="/dang-nhap" className="inline-flex h-12 items-center justify-center rounded-lg bg-background px-6 font-semibold text-foreground transition-colors hover:bg-background/90">
            Đăng ký miễn phí
          </Link>
        </div>
      </section>
    </main>
  );
}
