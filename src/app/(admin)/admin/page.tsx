import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Quản trị · AI Campus Tour" };

export default function AdminHomePage() {
  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Quản trị</h1>
      <nav className="flex flex-col gap-2">
        <Link href="/admin/nguoi-dung" className="text-primary underline-offset-4 hover:underline">
          Người dùng
        </Link>
        <Link href="/admin/truong" className="text-primary underline-offset-4 hover:underline">
          Trường, khoa, lớp
        </Link>
        <Link href="/admin/su-kien" className="text-primary underline-offset-4 hover:underline">
          Sự kiện workshop và mã kích hoạt
        </Link>
        <Link href="/admin/luu-tru" className="text-primary underline-offset-4 hover:underline">
          Lưu trữ file (Google Drive)
        </Link>
        <Link href="/admin/nhat-ky" className="text-primary underline-offset-4 hover:underline">
          Nhật ký
        </Link>
      </nav>
    </main>
  );
}
