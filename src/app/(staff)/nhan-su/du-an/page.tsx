import type { Metadata } from "next";
import Link from "next/link";
import { requireActor } from "@/modules/identity/session";
import { FINAL_STATUS_LABELS } from "@/modules/project-certificate/fields";
import { finalQueue } from "@/modules/project-certificate/service";

export const metadata: Metadata = { title: "Chấm dự án cuối · AI Campus Tour" };

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });

export default async function FinalQueuePage() {
  const actor = await requireActor();
  const queue = await finalQueue(actor);
  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Dự án cuối chờ chấm</h1>
      <p className="text-sm text-muted-foreground">Dự án ≥ 90 điểm cần mentor thứ hai chấm độc lập (bất kỳ mentor nào, trừ người chấm lần 1).</p>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {queue.map((q) => (
          <li key={q.id}>
            <Link href={`/nhan-su/du-an/${q.id}`} className="flex flex-col gap-1 p-4 hover:bg-foreground/5">
              <span className="font-medium">
                {q.studentName || q.studentEmail} · {q.title}
              </span>
              <span className="text-sm text-muted-foreground">
                {q.schoolName} · {FINAL_STATUS_LABELS[q.status]}
                {q.version > 1 ? ` · nộp lại lần ${q.version}` : ""} · nộp {dateFormat.format(q.submittedAt)}
              </span>
              <span className={q.overdue ? "text-sm font-medium text-destructive" : "text-sm"}>
                Hạn phản hồi: {dateFormat.format(q.reviewDueAt)}
                {q.overdue ? " (quá hạn)" : ""}
              </span>
            </Link>
          </li>
        ))}
        {queue.length === 0 ? <li className="p-4 text-muted-foreground">Không có dự án nào đang chờ.</li> : null}
      </ul>
    </main>
  );
}
