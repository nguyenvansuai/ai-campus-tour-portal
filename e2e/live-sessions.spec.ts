import { expect, test } from "@playwright/test";
import { makeSuperAdmin } from "./support/db";
import { signInWithOtp } from "./support/login";
import { enrollStudent } from "./support/student";

test("Admin tạo giờ hỗ trợ; SV bấm Tham gia được chuyển sang meet.suai.vn và được điểm danh", async ({ browser }) => {
  const stamp = Date.now();
  const bossEmail = `boss-live-${stamp}@example.com`;
  makeSuperAdmin(bossEmail);
  const boss = await browser.newPage();
  await signInWithOtp(boss, bossEmail);
  await boss.goto("/nhan-su/ho-tro");
  const title = `Hỏi đáp E2E ${stamp}`;
  await boss.getByLabel("Tiêu đề").fill(title);
  const startsAt = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 16);
  await boss.getByLabel("Bắt đầu (giờ Việt Nam)").fill(startsAt);
  await boss.getByRole("button", { name: "Tạo buổi hỗ trợ" }).click();
  await expect(boss.getByRole("status")).toHaveText("Đã tạo 1 buổi.");

  const student = await browser.newPage();
  await enrollStudent(student, `live-${stamp}@example.com`);
  await student.goto("/hoc");
  await student.getByRole("link", { name: /giờ hỗ trợ trực tuyến/ }).click();
  const item = student.getByRole("listitem").filter({ hasText: title });
  const join = item.getByRole("link", { name: "Tham gia" });
  const href = await join.getAttribute("href");
  const response = await student.request.get(href!, { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toMatch(/^https:\/\/meet\.suai\.vn\/aict-ho-tro-[0-9a-f]{12}#userInfo\.displayName=/);

  await boss.reload();
  await expect(boss.getByRole("listitem").filter({ hasText: title }).getByRole("link", { name: "1 người tham gia" })).toBeVisible();
});
