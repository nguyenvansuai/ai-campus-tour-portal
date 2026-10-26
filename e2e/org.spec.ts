import { expect, test } from "@playwright/test";
import { makeSuperAdmin } from "./support/db";
import { signInWithOtp } from "./support/login";

test("Admin tạo trường, khoa, sự kiện, mã kích hoạt rồi mời giáo viên theo khoa", async ({ page }) => {
  const stamp = Date.now();
  const bossEmail = `boss-org-${stamp}@example.com`;
  const schoolName = `ĐH Thử Nghiệm ${stamp}`;
  makeSuperAdmin(bossEmail);
  await signInWithOtp(page, bossEmail);

  await page.goto("/admin/truong");
  await page.getByLabel("Tên trường", { exact: true }).fill(schoolName);
  await page.getByLabel(/Đã kết nối/).check();
  await page.getByRole("button", { name: "Thêm trường" }).click();
  await expect(page.getByRole("status")).toHaveText("Đã thêm trường.");

  await page.getByRole("link", { name: new RegExp(schoolName) }).click();
  await page.getByLabel("Tên khoa").fill("Khoa Kế toán");
  await page.getByRole("button", { name: "Thêm khoa" }).click();
  await expect(page.getByRole("heading", { name: "Khoa Kế toán" })).toBeVisible();

  await page.goto("/admin/su-kien");
  await page.getByLabel("Trường đăng cai").selectOption({ label: schoolName });
  await page.getByLabel("Tên sự kiện").fill(`Workshop ${stamp}`);
  await page.getByLabel("Ngày tổ chức").fill("2026-11-15");
  await page.getByRole("button", { name: "Tạo sự kiện" }).click();
  await expect(page.getByRole("heading", { name: `Workshop ${stamp}` })).toBeVisible();
  await page.getByRole("button", { name: "Tạo mã kích hoạt" }).first().click();
  await expect(page.getByText(/\/bat-dau\?ma=[A-Z2-9]{8}/).first()).toBeVisible();

  await page.goto("/admin/nguoi-dung/moi");
  await page.getByLabel("Email người được mời").fill(`gv-${stamp}@example.com`);
  await page.getByLabel("Vai trò").selectOption("teacher");
  await page.getByLabel("Phạm vi").selectOption("faculty");
  await page.getByLabel("Khoa", { exact: true }).selectOption({ label: `${schoolName} – Khoa Kế toán` });
  await page.getByRole("button", { name: "Gửi lời mời" }).click();
  await expect(page.getByRole("status")).toHaveText(`Đã gửi lời mời tới gv-${stamp}@example.com.`);
});
