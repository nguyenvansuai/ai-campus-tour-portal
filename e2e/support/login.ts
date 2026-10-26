import { expect, type Page } from "@playwright/test";
import { latestOtpFor } from "./outbox";

export async function signInWithOtp(page: Page, email: string) {
  await page.goto("/dang-nhap");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Gửi mã" }).click();
  await page.getByLabel("Mã 6 số").fill(await latestOtpFor(email));
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/(hoc|bat-dau|admin|nhan-su)(\?.*)?$/);
}
