import { expect, test } from "@playwright/test";
import { latestOtpFor } from "./support/outbox";

test("SV quét mã workshop, đăng nhập, khai báo M0 rồi vào trang học", async ({ page }) => {
  const email = `onboard-${Date.now()}@example.com`;
  // Trường chưa có trong danh sách → SV tự nhập (không cần dữ liệu chuẩn bị trước).
  await page.goto("/bat-dau?ma=KHONGCOMA");
  await expect(page).toHaveURL(/\/dang-nhap\?next=/);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Gửi mã" }).click();
  await page.getByLabel("Mã 6 số").fill(await latestOtpFor(email));
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page).toHaveURL(/\/bat-dau\?ma=KHONGCOMA$/);
  await expect(page.getByText("Mã workshop không hợp lệ hoặc đã hết hạn.")).toBeVisible();

  await page.getByLabel("Họ và tên").fill("Nguyễn Thị Thử");
  await page.getByLabel("Trường", { exact: true }).selectOption("other");
  await page.getByLabel("Tên trường của bạn").fill(`ĐH Thử E2E ${Date.now()}`);
  await page.getByLabel("Tên khoa").fill("Kế toán");
  await page.getByLabel(/^B\./).check();
  await page.getByLabel("Vị trí bạn muốn ứng tuyển sau khi ra trường").fill("Nhân viên kế toán");
  for (const group of await page.getByRole("radiogroup").all()) {
    const options = group.locator("input[type=radio]");
    if ((await options.count()) === 5) await group.locator("label").nth(1).click();
  }
  await page.getByLabel(/Tôi đã đọc và đồng ý/).check();
  await page.getByLabel(/Viện Đào tạo Bách Khoa xem tiến độ/).check();
  await page.getByRole("button", { name: "Bắt đầu lộ trình 30 ngày" }).click();

  await expect(page).toHaveURL(/\/hoc\?chao=1/);
});
