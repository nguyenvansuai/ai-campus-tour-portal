import { expect, test } from "@playwright/test";
import { makeSuperAdmin } from "./support/db";
import { signInWithOtp } from "./support/login";
import { enrollStudent } from "./support/student";

test("Admin xem tiến độ, mở chi tiết SV, gia hạn và tải CSV", async ({ browser }) => {
  const stamp = Date.now();
  const studentEmail = `dash-${stamp}@example.com`;
  const bossEmail = `boss-dash-${stamp}@example.com`;
  makeSuperAdmin(bossEmail);
  const student = await browser.newPage();
  await enrollStudent(student, studentEmail);

  const boss = await browser.newPage();
  await signInWithOtp(boss, bossEmail);
  await boss.goto("/truong");
  await expect(boss.getByRole("heading", { name: "Tiến độ sinh viên" })).toBeVisible();
  const download = boss.waitForEvent("download");
  await boss.getByRole("link", { name: "Xuất Excel (CSV)" }).click();
  expect((await download).suggestedFilename()).toMatch(/^tien-do-sinh-vien-.*\.csv$/);

  await boss.getByRole("link", { name: /Sinh Viên E2E/ }).first().click();
  boss.once("dialog", (dialog) => dialog.accept());
  await boss.getByRole("button", { name: "Gia hạn +7 ngày" }).click();
  await expect(boss.getByText(/đã gia hạn/)).toBeVisible();
});
