import { expect, test } from "@playwright/test";
import { makeSuperAdmin } from "./support/db";
import { signInWithOtp } from "./support/login";

test("Super Admin tìm sinh viên, khóa tài khoản; sinh viên bị đăng xuất", async ({ browser }) => {
  const stamp = Date.now();
  const bossEmail = `boss-users-${stamp}@example.com`;
  const studentEmail = `sv-users-${stamp}@example.com`;
  makeSuperAdmin(bossEmail);

  const student = await browser.newPage();
  await signInWithOtp(student, studentEmail);

  const boss = await browser.newPage();
  await signInWithOtp(boss, bossEmail);
  await boss.goto("/admin/nguoi-dung");
  await boss.getByLabel("Tìm theo email hoặc tên").fill(studentEmail);
  await boss.getByRole("button", { name: "Lọc" }).click();
  await boss.getByRole("link", { name: new RegExp(studentEmail) }).click();
  await expect(boss.getByRole("heading", { name: studentEmail })).toBeVisible();

  boss.once("dialog", (dialog) => dialog.accept());
  await boss.getByRole("button", { name: "Khóa tài khoản" }).click();
  await expect(boss.getByRole("status")).toHaveText("Đã khóa tài khoản và đăng xuất mọi thiết bị.");

  await student.goto("/hoc");
  await expect(student).toHaveURL(/\/dang-nhap$/);
});
