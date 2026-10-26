import { createHmac } from "node:crypto";
import { and, eq, gte, inArray, lt, lte, notInArray } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { escapeHtml, sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { MODULES } from "@/modules/curriculum/content/program";
import { vnDateOf, type ReportModuleId } from "@/modules/enrollment/schedule";
import { enrollment } from "@/modules/enrollment/schema";
import { scheduleOf } from "@/modules/enrollment/service";
import { getConsents } from "@/modules/identity/consent";
import { user } from "@/modules/identity/schema";
import { moduleReport } from "@/modules/learning/schema";
import { finalProject } from "@/modules/project-certificate/schema";
import { reportReview } from "@/modules/review/schema";
import { notificationLog } from "./schema";

const DAY = 86_400_000;
const REPORT_MODULES: ReportModuleId[] = ["M1", "M2", "M3", "M4"];
const OPEN = ["active", "paused", "inactive"] as const;
const dateFormat = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });

type Recipient = { id: string; email: string; name: string; phone: string | null };
type Message = { kind: string; ref: string; subject: string; lines: string[]; path: string };

/** Ghi log trước rồi mới gửi: nếu đã có log (đã gửi) thì bỏ qua. Trả về true nếu thực sự gửi. */
async function notifyOnce(to: Recipient, message: Message) {
  const inserted = await db
    .insert(notificationLog)
    .values({ recipientId: to.id, kind: message.kind, ref: message.ref })
    .onConflictDoNothing()
    .returning({ id: notificationLog.id });
  if (!inserted.length) return false;

  const link = `${env().APP_URL}${message.path}`;
  const greeting = `Chào ${to.name || "bạn"},`;
  await sendEmail({
    to: to.email,
    subject: message.subject,
    text: [greeting, "", ...message.lines, "", `Mở portal: ${link}`, "", "AI Campus Tour"].join("\n"),
    html: `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5"><p>${escapeHtml(greeting)}</p>${message.lines
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("")}<p><a href="${link}">Mở portal AI Campus Tour</a></p></div>`,
  });
  await sendWebhook(to, message, link);
  return true;
}

/** Gửi sự kiện sang n8n (để gửi Zalo) nếu đã cấu hình. Chỉ kèm SĐT khi người nhận đồng ý nhận Zalo. */
async function sendWebhook(to: Recipient, message: Message, link: string) {
  const { NOTIFY_WEBHOOK_URL, NOTIFY_WEBHOOK_SECRET } = env();
  if (!NOTIFY_WEBHOOK_URL) return;
  const zalo = to.phone ? (await getConsents(to.id)).some((c) => c.key === "zalo_notifications") : false;
  const body = JSON.stringify({ event: message.kind, ref: message.ref, name: to.name, email: to.email, phone: zalo ? to.phone : null, subject: message.subject, message: message.lines.join("\n"), link });
  const signature = NOTIFY_WEBHOOK_SECRET ? createHmac("sha256", NOTIFY_WEBHOOK_SECRET).update(body).digest("hex") : "";
  try {
    await fetch(NOTIFY_WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json", "x-aict-signature": signature }, body });
  } catch {
    // Webhook lỗi không được làm hỏng việc gửi email.
  }
}

async function recipient(userId: string): Promise<Recipient | null> {
  const [row] = await db.select({ id: user.id, email: user.email, name: user.name, phone: user.phone, status: user.status }).from(user).where(eq(user.id, userId));
  return row && row.status === "active" ? row : null;
}

const moduleTitle = (id: string) => MODULES.find((m) => m.id === id)?.title ?? id;

// ---------------------------------------------------------------------------

export async function remindDeadlines(now = new Date()) {
  let sent = 0;
  const rows = await db.select().from(enrollment).where(eq(enrollment.status, "active"));
  const reports = rows.length ? await db.select({ enrollmentId: moduleReport.enrollmentId, moduleId: moduleReport.moduleId }).from(moduleReport).where(inArray(moduleReport.enrollmentId, rows.map((r) => r.id))) : [];
  for (const row of rows) {
    const schedule = scheduleOf(row, now);
    const to = await recipient(row.userId);
    if (!to) continue;
    for (const moduleId of REPORT_MODULES) {
      if (reports.some((r) => r.enrollmentId === row.id && r.moduleId === moduleId)) continue;
      const deadline = schedule.deadlines[moduleId];
      const remaining = deadline.getTime() - now.getTime();
      if (remaining > 0 && remaining <= DAY) {
        sent += Number(
          await notifyOnce(to, {
            kind: "due_soon",
            ref: `${row.id}:${moduleId}:${deadline.toISOString()}`,
            subject: `Còn chưa đến 24 giờ để nộp báo cáo ${moduleId}`,
            lines: [`Hạn nộp báo cáo ${moduleId} – ${moduleTitle(moduleId)} là ${dateFormat.format(deadline)}.`, "Hoàn thành các buổi còn lại và nộp báo cáo để mở module tiếp theo."],
            path: `/hoc/bao-cao/${moduleId}`,
          }),
        );
      } else if (remaining <= 0 && now < schedule.hardDeadline) {
        sent += Number(
          await notifyOnce(to, {
            kind: "overdue",
            ref: `${row.id}:${moduleId}`,
            subject: `Bạn đã trễ hạn báo cáo ${moduleId}`,
            lines: [`Báo cáo ${moduleId} – ${moduleTitle(moduleId)} đã quá hạn. Bạn vẫn nộp được (ghi nhận trễ).`, "Nếu đang gặp khó khăn, hãy trả lời email này hoặc hỏi trợ giảng để được hỗ trợ gia hạn."],
            path: `/hoc/bao-cao/${moduleId}`,
          }),
        );
      }
    }
  }
  return sent;
}

export async function remindInactive(now = new Date()) {
  let sent = 0;
  const rows = await db
    .select()
    .from(enrollment)
    .where(and(inArray(enrollment.status, ["active", "inactive"]), lte(enrollment.lastActivityAt, new Date(now.getTime() - 7 * DAY))));
  for (const row of rows) {
    const idleDays = Math.floor((now.getTime() - row.lastActivityAt.getTime()) / DAY);
    const period = vnDateOf(row.lastActivityAt);
    const to = await recipient(row.userId);
    if (to) {
      sent += Number(
        await notifyOnce(to, {
          kind: "inactive_7",
          ref: `${row.id}:${period}`,
          subject: "Đã 7 ngày bạn chưa học tiếp",
          lines: [`Đã ${idleDays} ngày bạn chưa hoàn thành buổi học nào trên lộ trình 30 ngày.`, "Chỉ cần 45–60 phút cho buổi tiếp theo. Mở portal để xem việc cần làm hôm nay."],
          path: "/hoc",
        }),
      );
    }
    if (idleDays >= 14 && row.taId) {
      const ta = await recipient(row.taId);
      const student = await recipient(row.userId);
      if (ta && student) {
        sent += Number(
          await notifyOnce(ta, {
            kind: "ta_alert_14",
            ref: `${row.id}:${period}`,
            subject: `SV ${student.name || student.email} đã ${idleDays} ngày không hoạt động`,
            lines: [`Sinh viên ${student.name || student.email} (${student.email}) đã ${idleDays} ngày không hoạt động.`, "Vui lòng liên hệ hỗ trợ hoặc cân nhắc bảo lưu/gia hạn."],
            path: `/truong/sinh-vien/${row.id}`,
          }),
        );
      }
    }
  }
  return sent;
}

export async function notifyReviewResults(now = new Date()) {
  let sent = 0;
  const reviews = await db
    .select({ review: reportReview, enrollmentId: moduleReport.enrollmentId, moduleId: moduleReport.moduleId })
    .from(reportReview)
    .innerJoin(moduleReport, eq(moduleReport.id, reportReview.reportId))
    .where(and(gte(reportReview.createdAt, new Date(now.getTime() - 3 * DAY)), inArray(reportReview.result, ["returned", "passed", "needs_revision"])));
  for (const { review, enrollmentId, moduleId } of reviews) {
    const [row] = await db.select().from(enrollment).where(eq(enrollment.id, enrollmentId));
    const to = row ? await recipient(row.userId) : null;
    if (!to) continue;
    const result =
      review.result === "passed"
        ? { subject: `Báo cáo ${moduleId} đã Đạt`, line: `Chúc mừng! Báo cáo ${moduleId} của bạn đã được chấm Đạt.` }
        : review.result === "needs_revision"
          ? { subject: `Báo cáo ${moduleId} cần sửa`, line: `Mentor đã nhận xét báo cáo ${moduleId}. Bạn xem nhận xét, sửa và nộp lại trong 7 ngày.` }
          : { subject: `Báo cáo ${moduleId} cần bổ sung hồ sơ`, line: `Trợ giảng đã trả lại báo cáo ${moduleId} do thiếu hồ sơ. Bạn bổ sung và nộp lại.` };
    sent += Number(await notifyOnce(to, { kind: "review_result", ref: review.id, subject: result.subject, lines: [result.line], path: `/hoc/bao-cao/${moduleId}` }));
  }
  return sent;
}

export async function alertOverdueReviews(now = new Date()) {
  let sent = 0;
  const rows = await db
    .select({ report: moduleReport, mentorId: enrollment.mentorId })
    .from(moduleReport)
    .innerJoin(enrollment, eq(enrollment.id, moduleReport.enrollmentId))
    .where(and(inArray(moduleReport.status, ["submitted", "prechecked"]), lt(moduleReport.reviewDueAt, now)));
  for (const { report, mentorId } of rows) {
    const to = mentorId ? await recipient(mentorId) : null;
    if (!to) continue;
    sent += Number(
      await notifyOnce(to, {
        kind: "review_overdue",
        ref: `${report.id}:v${report.version}`,
        subject: `Có báo cáo ${report.moduleId} quá hạn phản hồi`,
        lines: [`Một báo cáo ${report.moduleId} đã quá hạn phản hồi 3 ngày. Vui lòng chấm sớm để SV không bị chậm.`],
        path: `/nhan-su/bao-cao/${report.id}`,
      }),
    );
  }
  return sent;
}

/** 21 ngày không hoạt động → inactive; quá hạn cứng → failed. */
export async function updateStatuses(now = new Date()) {
  const inactive = await db
    .update(enrollment)
    .set({ status: "inactive" })
    .where(and(eq(enrollment.status, "active"), lte(enrollment.lastActivityAt, new Date(now.getTime() - 21 * DAY))))
    .returning({ id: enrollment.id });
  let failed = 0;
  // Dự án cuối đang chấm hoặc đã Đạt thì không đánh rớt vì hạn cứng (chờ chấm/duyệt chứng nhận).
  const inProgress = db.select({ id: finalProject.enrollmentId }).from(finalProject).where(inArray(finalProject.status, ["submitted", "awaiting_second", "passed"]));
  for (const row of await db.select().from(enrollment).where(and(inArray(enrollment.status, [...OPEN]), notInArray(enrollment.id, inProgress)))) {
    if (now > scheduleOf(row, now).hardDeadline) {
      await db.update(enrollment).set({ status: "failed" }).where(eq(enrollment.id, row.id));
      await recordAudit({ actorId: null, action: "enrollment.expired", targetType: "enrollment", targetId: row.id });
      failed++;
    }
  }
  return { inactive: inactive.length, failed };
}

export async function runJobs(now = new Date()) {
  const statuses = await updateStatuses(now);
  return {
    ...statuses,
    deadlines: await remindDeadlines(now),
    inactiveReminders: await remindInactive(now),
    reviewResults: await notifyReviewResults(now),
    overdueReviews: await alertOverdueReviews(now),
  };
}
