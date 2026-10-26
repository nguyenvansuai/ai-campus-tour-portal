import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

export const E2E_OUTBOX_DIR = path.resolve("test-results/outbox");

type SavedMail = { to: string; subject: string; text: string };

/** Đọc mã OTP mới nhất gửi tới email (server e2e ghi thư ra file thay vì gửi thật). */
export async function latestOtpFor(email: string, timeoutMs = 10_000): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const files = (await readdir(E2E_OUTBOX_DIR).catch(() => [])).sort().reverse();
    for (const file of files) {
      const mail = JSON.parse(await readFile(path.join(E2E_OUTBOX_DIR, file), "utf8")) as SavedMail;
      const otp = mail.to === email.toLowerCase() ? mail.text.match(/\b(\d{6})\b/)?.[1] : undefined;
      if (otp) return otp;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Không thấy mã OTP gửi tới ${email}`);
}

export async function clearOutbox() {
  await rm(E2E_OUTBOX_DIR, { recursive: true, force: true });
}
