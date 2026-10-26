import Link from "next/link";
import { FounderCard } from "@/components/brand/founder-card";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Campus Tour</h1>
        <p className="text-sm text-muted-foreground">Sáng lập bởi Sự AI</p>
      </div>
      <p className="text-base leading-7">
        Lộ trình tự học AI ứng dụng trong 30 ngày, có mentor đồng hành và chứng nhận khi hoàn thành.
      </p>
      <Link
        href="/dang-nhap"
        className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Bắt đầu học
      </Link>
      <FounderCard />
    </main>
  );
}
