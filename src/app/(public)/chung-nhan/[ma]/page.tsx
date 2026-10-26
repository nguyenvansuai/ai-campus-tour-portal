import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { env } from "@/lib/env";
import { PROGRAM_TITLE } from "@/modules/curriculum/content/program";
import { GRADE_LABELS } from "@/modules/project-certificate/fields";
import { verifyCertificate } from "@/modules/project-certificate/service";
import { PrintButton } from "@/modules/project-certificate/ui/print-button";

export const metadata: Metadata = { title: "Chứng nhận · AI Campus Tour", robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });

export default async function CertificatePage({ params }: PageProps<"/chung-nhan/[ma]">) {
  const info = await verifyCertificate(decodeURIComponent((await params).ma));
  if (!info) notFound();
  const verifyUrl = `${env().APP_URL}/xac-thuc/${info.code}`;
  // SVG do thư viện sinh từ URL của portal, không chứa dữ liệu người dùng.
  const qr = await QRCode.toString(verifyUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M" });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6 print:max-w-none print:p-0">
      <style>{"@page { size: A4 landscape; margin: 10mm; }"}</style>
      <div className="flex items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">Bấm “In / Lưu PDF”, chọn khổ A4 nằm ngang.</p>
        <PrintButton />
      </div>
      {info.revoked ? (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 font-semibold text-destructive">
          Chứng nhận này đã bị thu hồi.
        </p>
      ) : null}
      <article className="relative flex aspect-[297/210] w-full flex-col items-center justify-between rounded-sm border-[6px] border-double border-primary/60 bg-white p-[4%] text-center text-neutral-900">
        <header className="flex w-full items-center justify-between">
          <span className="text-left text-sm font-semibold uppercase tracking-wide">{info.issuers.join(" · ")}</span>
          <Image src="/brand/suai-logo.png" alt="Sự AI" width={543} height={231} unoptimized className="h-10 w-auto" />
        </header>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-600">AI Campus Tour</p>
          <h1 className="text-3xl font-bold uppercase tracking-wide sm:text-4xl">Chứng nhận hoàn thành</h1>
          <p className="text-base">Chứng nhận</p>
          <p className="text-3xl font-semibold text-primary sm:text-4xl">{info.studentName}</p>
          <p className="text-base">Sinh viên {info.schoolName}</p>
          <p className="max-w-[80%] text-base">
            đã hoàn thành <strong>{PROGRAM_TITLE}</strong> với xếp loại <strong>{GRADE_LABELS[info.grade]}</strong>, dự án cuối khóa: “{info.projectTitle}”.
          </p>
        </div>
        <footer className="flex w-full items-end justify-between text-left text-xs">
          <div className="flex flex-col gap-1">
            <span>Ngày cấp: {dateFormat.format(info.issuedAt)}</span>
            <span>
              Mã chứng nhận: <span className="font-mono font-semibold">{info.code}</span>
            </span>
            <span>Xác thực tại: {verifyUrl}</span>
          </div>
          <div className="size-24" aria-label="Mã QR xác thực" dangerouslySetInnerHTML={{ __html: qr }} />
        </footer>
      </article>
    </main>
  );
}
