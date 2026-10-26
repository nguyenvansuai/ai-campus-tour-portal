import Link from "next/link";

export default function Forbidden() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-12">
      <h1 className="text-2xl font-bold">Bạn không có quyền truy cập trang này</h1>
      <p className="text-muted-foreground">
        Nếu bạn nghĩ đây là nhầm lẫn, vui lòng liên hệ ban tổ chức AI Campus Tour.
      </p>
      <Link href="/hoc" className="font-medium text-primary underline-offset-4 hover:underline">
        Về trang học của tôi
      </Link>
    </main>
  );
}
