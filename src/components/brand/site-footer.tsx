import Image from "next/image";

/** Chân trang chung: ghi nhận Sự AI là người sáng lập và tài trợ phát triển portal. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center text-sm text-muted-foreground sm:flex-row sm:justify-center">
        <span>AI Campus Tour · Sáng lập và tài trợ phát triển bởi</span>
        <a href="https://www.suai.vn" target="_blank" rel="noopener" aria-label="Sự AI" className="inline-flex">
          <Image src="/brand/suai-logo.png" alt="Sự AI" width={543} height={231} unoptimized className="h-7 w-auto" />
        </a>
      </div>
    </footer>
  );
}
