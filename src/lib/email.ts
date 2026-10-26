import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

export type OutgoingEmail = { to: string; subject: string; text: string; html: string };
export type SentEmail = OutgoingEmail & { from: string; sentAt: Date };

/** Thư đã "gửi" khi EMAIL_TRANSPORT=memory (chỉ dùng trong test). */
export const memoryOutbox: SentEmail[] = [];

function fromHeader() {
  const { EMAIL_FROM, EMAIL_FROM_NAME } = env();
  return `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`;
}

async function sendWithBrevo(mail: OutgoingEmail) {
  const { EMAIL_FROM, EMAIL_FROM_NAME, BREVO_API_KEY } = env();
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY ?? "", "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: EMAIL_FROM, name: EMAIL_FROM_NAME },
      to: [{ email: mail.to }],
      subject: mail.subject,
      textContent: mail.text,
      htmlContent: mail.html,
    }),
  });
  // Không đưa nội dung thư vào lỗi: thư có thể chứa mã OTP.
  if (!response.ok) throw new Error(`Brevo từ chối gửi email (HTTP ${response.status})`);
}

/** Dev: mỗi thư là một file JSON trong EMAIL_OUTBOX_DIR, để xem mã OTP mà không phải log ra console. */
async function sendToFile(mail: SentEmail) {
  const dir = path.resolve(env().EMAIL_OUTBOX_DIR);
  await mkdir(dir, { recursive: true });
  const name = `${mail.sentAt.getTime()}-${mail.to.replace(/[^a-z0-9@.]/gi, "_")}.json`;
  await writeFile(path.join(dir, name), JSON.stringify(mail, null, 2));
}

export async function sendEmail(mail: OutgoingEmail) {
  const sent: SentEmail = { ...mail, from: fromHeader(), sentAt: new Date() };
  switch (env().EMAIL_TRANSPORT) {
    case "brevo":
      return sendWithBrevo(mail);
    case "file":
      return sendToFile(sent);
    case "memory":
      memoryOutbox.push(sent);
      return;
  }
}

export function renderOtpEmail(otp: string): Omit<OutgoingEmail, "to"> {
  const text = [
    `Mã đăng nhập AI Campus Tour của bạn là: ${otp}`,
    "",
    "Mã có hiệu lực trong 10 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.",
    "Nếu bạn không yêu cầu đăng nhập, hãy bỏ qua email này.",
  ].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5">
<p>Mã đăng nhập AI Campus Tour của bạn là:</p>
<p style="font-size:32px;font-weight:700;letter-spacing:6px">${otp}</p>
<p>Mã có hiệu lực trong 10 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
<p style="color:#525252">Nếu bạn không yêu cầu đăng nhập, hãy bỏ qua email này.</p>
</div>`;
  return { subject: `Mã đăng nhập AI Campus Tour: ${otp}`, text, html };
}
