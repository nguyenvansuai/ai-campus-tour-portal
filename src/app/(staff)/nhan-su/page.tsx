import type { Metadata } from "next";
import Link from "next/link";
import { requireActor } from "@/modules/identity/session";
import { reviewQueue } from "@/modules/review/service";

export const metadata: Metadata = { title: "Hàng đợi chấm · AI Campus Tour" };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });

export default async function QueuePage({ searchParams }: PageProps<"/nhan-su">) {
  const actor = await requireActor();
  const params = await searchParams;
  const showAll = params.tat_ca === "1";
  const moduleId = typeof params.module === "string" && params.module ? params.module : undefined;
  const queue = await reviewQueue(actor, { mine: !showAll, moduleId });
  const overdue = queue.filter((q) => q.overdue).length;

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Hàng đợi chấm</h1>
      <p className="text-sm text-muted-foreground">
        {queue.length} bài đang chờ{overdue ? ` · ${overdue} bài quá hạn phản hồi` : ""}. Sắp theo hạn phản hồi (nộp + 3 ngày).
      </p>
      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Bộ lọc">
        <Link href="/nhan-su" className={!showAll ? "font-semibold text-primary" : ""}>
          Bài của tôi
        </Link>
        <Link href="/nhan-su?tat_ca=1" className={showAll ? "font-semibold text-primary" : ""}>
          Tất cả (admin)
        </Link>
        {["M1", "M2", "M3", "M4"].map((m) => (
          <Link key={m} href={`/nhan-su?module=${m}${showAll ? "&tat_ca=1" : ""}`} className={moduleId === m ? "font-semibold text-primary" : ""}>
            {m}
          </Link>
        ))}
      </nav>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {queue.map((q) => (
          <li key={q.id}>
            <Link href={`/nhan-su/bao-cao/${q.id}`} className="flex flex-col gap-1 p-4 hover:bg-foreground/5">
              <span className="font-medium">
                {q.moduleId} · {q.studentName || q.studentEmail} · khối {q.track}
                {q.version > 1 ? ` · nộp lại lần ${q.version}` : ""}
              </span>
              <span className="text-sm text-muted-foreground">
                {q.schoolName} · {q.status === "prechecked" ? "Đã kiểm hồ sơ" : "Chờ kiểm"} · nộp {dateFormat.format(q.submittedAt)}
                {q.late ? " · nộp trễ" : ""}
              </span>
              <span className={q.overdue ? "text-sm font-medium text-destructive" : "text-sm"}>
                Hạn phản hồi: {dateFormat.format(q.reviewDueAt)}
                {q.overdue ? " (quá hạn)" : ""}
              </span>
            </Link>
          </li>
        ))}
        {queue.length === 0 ? <li className="p-4 text-muted-foreground">Không có bài nào đang chờ.</li> : null}
      </ul>
    </main>
  );
}
