import type { Metadata } from "next";
import Link from "next/link";
import { GRADE_LABELS } from "@/modules/project-certificate/fields";
import { verifyCertificate } from "@/modules/project-certificate/service";

export const metadata: Metadata = { title: "Xác thực chứng nhận · AI Campus Tour", robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });

export default async function VerifyPage({ params }: PageProps<"/xac-thuc/[ma]">) {
  const info = await verifyCertificate(decodeURIComponent((await params).ma));
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-12">
      <h1 className="text-2xl font-bold">Xác thực chứng nhận</h1>
      {!info ? (
        <p role="alert" className="rounded-lg bg-destructive/10 p-4">
          Không tìm thấy chứng nhận với mã này. Vui lòng kiểm tra lại mã.
        </p>
      ) : (
        <section className="flex flex-col gap-3 rounded-xl border border-border p-5">
          {info.revoked ? (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 font-semibold text-destructive">
              Chứng nhận này đã bị thu hồi và không còn giá trị.
            </p>
          ) : (
            <p className="rounded-lg bg-green-700/10 p-3 font-semibold text-green-800 dark:text-green-300">✓ Chứng nhận hợp lệ</p>
          )}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Họ tên</dt>
            <dd className="font-medium">{info.studentName}</dd>
            <dt className="text-muted-foreground">Trường</dt>
            <dd>{info.schoolName}</dd>
            <dt className="text-muted-foreground">Chương trình</dt>
            <dd>Lộ trình Ứng dụng AI 30 ngày</dd>
            <dt className="text-muted-foreground">Xếp loại</dt>
            <dd>{GRADE_LABELS[info.grade]}</dd>
            <dt className="text-muted-foreground">Dự án</dt>
            <dd>
              {info.projectUrl ? (
                <a href={info.projectUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-primary underline">
                  {info.projectTitle}
                </a>
              ) : (
                info.projectTitle
              )}
            </dd>
            <dt className="text-muted-foreground">Đơn vị cấp</dt>
            <dd>{info.issuers.join(" và ")}</dd>
            <dt className="text-muted-foreground">Ngày cấp</dt>
            <dd>{dateFormat.format(info.issuedAt)}</dd>
            <dt className="text-muted-foreground">Mã</dt>
            <dd className="font-mono">{info.code}</dd>
          </dl>
        </section>
      )}
      <Link href="/xac-thuc" className="text-sm text-primary">
        Tra cứu mã khác
      </Link>
    </main>
  );
}
