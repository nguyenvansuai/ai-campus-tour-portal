import { expect, test } from "@playwright/test";
import { makeSuperAdmin } from "./support/db";
import { signInWithOtp } from "./support/login";

test("Super Admin mời Admin; người được mời đăng nhập thì vào được trang quản trị", async ({ browser }) => {
  const stamp = Date.now();
  const bossEmail = `boss-${stamp}@example.com`;
  const adminEmail = `admin-${stamp}@example.com`;
  makeSuperAdmin(bossEmail);

  const boss = await browser.newPage();
  await signInWithOtp(boss, bossEmail);
  await boss.goto("/admin/nguoi-dung/moi");
  await boss.getByLabel("Email người được mời").fill(adminEmail);
  await boss.getByLabel("Vai trò").selectOption("admin");
  await boss.getByRole("button", { name: "Gửi lời mời" }).click();
  await expect(boss.getByRole("status")).toHaveText(`Đã gửi lời mời tới ${adminEmail}.`);

  const invited = await browser.newPage();
  await signInWithOtp(invited, adminEmail);
  await invited.goto("/admin");
  await expect(invited.getByRole("heading", { name: "Tổng quan" })).toBeVisible();

  // Admin thường không thấy lựa chọn Super Admin.
  await invited.goto("/admin/nguoi-dung/moi");
  await expect(invited.getByLabel("Vai trò").locator("option", { hasText: "Super Admin" })).toHaveCount(0);
});
