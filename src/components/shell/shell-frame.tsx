"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/modules/identity/ui/sign-out-button";
import { Icon } from "./icons";
import { activeHref, type NavItem, type NavSection } from "./nav";

export type StudentProgress = { day: number; lessonsDone: number; lessonsTotal: number; next: { href: string; label: string } | null; paused: boolean };

type ShellFrameProps = { sections: NavSection[]; userName: string; roleLabel: string; progress: StudentProgress | null; quickLinks: NavItem[]; children: ReactNode };

export function ShellFrame({ sections, userName, roleLabel, progress, quickLinks, children }: ShellFrameProps) {
  const pathname = usePathname();
  // Menu trên điện thoại chỉ mở ở đúng trang đã bấm mở: chuyển trang là tự đóng.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = (value: boolean) => setOpenedAt(value ? pathname : null);
  const active = activeHref(sections, pathname);

  return (
    <div className={cn("flex min-h-full flex-1", quickLinks.length ? "max-lg:pb-16" : "")}>
      {open ? <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden /> : null}
      <aside
        id="app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-background transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 print:hidden",
          // Đóng thì ẩn hẳn trên điện thoại để bàn phím/trình đọc màn hình không đi vào menu.
          open ? "translate-x-0" : "-translate-x-full max-lg:invisible",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Image src="/brand/vien-dtbk-logo.webp" alt="" width={320} height={320} unoptimized className="size-8" />
            AI Campus Tour
          </Link>
          <button type="button" className="rounded-md p-1 hover:bg-foreground/5 lg:hidden" onClick={() => setOpen(false)} aria-label="Đóng menu">
            <Icon name="close" />
          </button>
        </div>

        {progress ? (
          <Link href={progress.next?.href ?? "/hoc"} className="m-3 flex flex-col gap-2 rounded-xl bg-primary/10 p-3 text-sm hover:bg-primary/15">
            <span className="flex items-baseline justify-between font-semibold">
              <span>Ngày {Math.min(progress.day, 30)}/30</span>
              <span className="text-xs font-medium text-muted-foreground">{progress.paused ? "Đang bảo lưu" : `${progress.lessonsDone}/${progress.lessonsTotal} buổi`}</span>
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-background" aria-hidden>
              <span className="block h-full rounded-full bg-primary" style={{ width: `${(progress.lessonsDone / progress.lessonsTotal) * 100}%` }} />
            </span>
            {progress.next ? <span className="truncate text-xs text-primary">Tiếp theo: {progress.next.label} →</span> : null}
          </Link>
        ) : null}

        <nav aria-label="Menu chính" className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-2">
          {sections.map((section) => (
            <div key={section.title} className="flex flex-col gap-1">
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</p>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active === item.href ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active === item.href ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground",
                  )}
                >
                  <Icon name={item.icon} className="size-5 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md p-2 hover:bg-foreground/5 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Mở menu"
              aria-expanded={open}
              aria-controls="app-sidebar"
            >
              <Icon name="menu" />
            </button>
            <span className="font-semibold lg:hidden">AI Campus Tour</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden flex-col text-right leading-tight sm:flex">
              <span className="text-sm font-medium">{userName}</span>
              <span className="text-xs text-muted-foreground">{roleLabel}</span>
            </span>
            <SignOutButton compact />
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </div>

      {quickLinks.length ? (
        <nav aria-label="Truy cập nhanh" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur lg:hidden print:hidden">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active === item.href ? "page" : undefined}
              className={cn("flex flex-col items-center gap-0.5 py-2 text-xs font-medium", active === item.href ? "text-primary" : "text-muted-foreground")}
            >
              <Icon name={item.icon} className="size-5" />
              {item.label}
            </Link>
          ))}
          <button type="button" onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-xs font-medium text-muted-foreground">
            <Icon name="menu" className="size-5" />
            Menu
          </button>
        </nav>
      ) : null}
    </div>
  );
}
