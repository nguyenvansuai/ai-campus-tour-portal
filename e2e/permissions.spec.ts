import { expect, test } from "@playwright/test";
import { latestOtpFor } from "./support/outbox";

test("chưa đăng nhập vào /admin thì chuyển về /dang-nhap", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dang-nhap$/);
});

test("sinh viên vào /admin thì thấy trang 403 tiếng Việt", async ({ page }) => {
  const email = `sv-admin-${Date.now()}@example.com`;
  await page.goto("/dang-nhap");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Gửi mã" }).click();
  await page.getByLabel("Mã 6 số").fill(await latestOtpFor(email));
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/bat-dau$/);

  const response = await page.goto("/admin");
  expect(response?.status()).toBe(403);
  await expect(page.getByRole("heading", { name: "Bạn không có quyền truy cập trang này" })).toBeVisible();
});
