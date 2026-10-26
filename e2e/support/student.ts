import { expect, type Page } from "@playwright/test";
import { signInWithOtp } from "./login";

/** Đăng nhập SV mới và hoàn tất onboarding với trường tự nhập. */
export async function enrollStudent(page: Page, email: string, track: "A" | "B" | "C" = "A") {
  await signInWithOtp(page, email);
  await page.goto("/bat-dau");
  await page.getByLabel("Họ và tên").fill("Sinh Viên E2E");
  await page.getByLabel("Trường", { exact: true }).selectOption("other");
  await page.getByLabel("Tên trường của bạn").fill(`ĐH E2E ${email}`);
  await page.getByLabel("Tên khoa").fill("Kế toán");
  await page.getByLabel(new RegExp(`^${track}\\.`)).check();
  await page.getByLabel("Vị trí bạn muốn ứng tuyển sau khi ra trường").fill("Nhân viên kế toán");
  for (const group of await page.getByRole("radiogroup").all()) {
    if ((await group.locator("input[type=radio]").count()) === 5) await group.locator("label").nth(2).click();
  }
  await page.getByLabel(/Tôi đã đọc và đồng ý/).check();
  await page.getByLabel(/Viện Đào tạo Bách Khoa xem tiến độ/).check();
  await page.getByRole("button", { name: "Bắt đầu lộ trình 30 ngày" }).click();
  await expect(page).toHaveURL(/\/hoc\?chao=1/);
}

const LONG = "Nội dung minh chứng đủ dài để vượt độ dài tối thiểu của ô này. ".repeat(6);
const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a6f40000000049454e44ae426082", "hex");

/** Mở buổi học và điền mọi ô minh chứng bằng dữ liệu hợp lệ. */
export async function completeLessonViaUi(page: Page, lessonNumber: number) {
  await page.goto(`/hoc/buoi/${lessonNumber}`);
  const form = page.locator("form").last();
  for (const textarea of await form.locator("textarea").all()) await textarea.fill(LONG);
  for (const input of await form.locator("input[type=text], input:not([type])").all()) await input.fill("Nhân viên kế toán");
  for (const input of await form.locator("input[type=url]").all()) await input.fill("https://docs.google.com/document/d/abc");
  for (const input of await form.locator("input[type=number]").all()) await input.fill("30");
  for (const input of await form.locator("input[type=file]").all()) {
    const accept = (await input.getAttribute("accept")) ?? "";
    await input.setInputFiles(
      accept.includes("pdf") ? { name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") } : { name: "anh.png", mimeType: "image/png", buffer: PNG },
    );
  }
  await form.getByRole("button", { name: /Nộp minh chứng|Cập nhật minh chứng/ }).click();
  await expect(form.getByRole("status")).toHaveText("Đã ghi nhận hoàn thành buổi học. Làm tốt lắm!");
}
