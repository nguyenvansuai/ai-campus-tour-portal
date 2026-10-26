import { expect, test } from "@playwright/test";
import { latestOtpFor } from "./support/outbox";

test("sinh viên đăng nhập bằng mã OTP trên điện thoại", async ({ page }) => {
  const email = `sv-${Date.now()}@example.com`;
  await page.goto("/dang-nhap");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Gửi mã" }).click();
  await expect(page.getByText(/Đã gửi mã 6 số tới/)).toBeVisible();

  await page.getByLabel("Mã 6 số").fill(await latestOtpFor(email));
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page).toHaveURL(/\/hoc$/);
  await expect(page.getByRole("heading", { name: `Xin chào, ${email}` })).toBeVisible();

  // Đã đăng nhập thì vào lại /dang-nhap sẽ được đưa thẳng tới trang học.
  await page.goto("/dang-nhap");
  await expect(page).toHaveURL(/\/hoc$/);

  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/dang-nhap$/);
});

test("nhập sai mã thì hiện lỗi tiếng Việt", async ({ page }) => {
  const email = `sai-${Date.now()}@example.com`;
  await page.goto("/dang-nhap");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Gửi mã" }).click();
  const otp = await latestOtpFor(email);
  await page.getByLabel("Mã 6 số").fill(otp === "000000" ? "111111" : "000000");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("Mã không đúng. Vui lòng kiểm tra lại.");
});

test("chưa cấu hình Google thì không hiện nút Google", async ({ page }) => {
  await page.goto("/dang-nhap");
  await expect(page.getByRole("button", { name: "Tiếp tục với Google" })).toHaveCount(0);
});

test("chưa đăng nhập thì không vào được trang học", async ({ page }) => {
  await page.goto("/hoc");
  await expect(page).toHaveURL(/\/dang-nhap$/);
});
