import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { makeSuperAdmin } from "./support/db";
import { signInWithOtp } from "./support/login";
import { enrollStudent } from "./support/student";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "postgres://portal:portal@localhost:5432/portal_test";

function seedReady(email: string) {
  execFileSync("pnpm", ["--silent", "exec", "tsx", "e2e/support/seed-ready.ts", email], {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, APP_URL: "http://localhost:3100", BETTER_AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-123" },
    stdio: "pipe",
  });
}

test("SV nộp dự án cuối → admin chấm → Viện duyệt → chứng nhận có QR, trang xác thực không lộ email", async ({ browser }) => {
  const stamp = Date.now();
  const studentEmail = `final-${stamp}@example.com`;
  const bossEmail = `boss-final-${stamp}@example.com`;
  makeSuperAdmin(bossEmail);

  const student = await browser.newPage();
  await enrollStudent(student, studentEmail);
  seedReady(studentEmail);

  await student.goto("/hoc");
  await student.getByRole("link", { name: "Dự án cuối và chứng nhận →" }).click();
  await expect(student.getByRole("heading", { name: "Dự án cuối · Tốt nghiệp" })).toBeVisible();
  await student.getByLabel("Tên dự án").fill("Tự động tổng hợp công nợ hằng tuần");
  await student.getByLabel("Vấn đề thật cần giải").fill("Kế toán công nợ mất 90 phút mỗi tuần để gom số liệu từ 3 file Excel và hay sót khách hàng.");
  await student.getByLabel("Ai dùng sản phẩm này").fill("Nhân viên kế toán công nợ");
  await student.getByLabel("Giải pháp: quy trình và công cụ AI bạn dùng").fill("Dùng ChatGPT viết công thức Power Query gom 3 file, Copilot tóm tắt khách nợ quá hạn và soạn email nhắc nợ tự động.");
  await student.getByLabel("Số đo trước/sau").fill("90 phút → 20 phút mỗi tuần");
  await student.getByLabel("Cách kiểm chứng kết quả và bảo vệ dữ liệu").fill("Đối chiếu tổng nợ với sổ cái 3 tuần liên tiếp, che tên khách hàng trước khi đưa vào AI.");
  await student.getByLabel("Link dự án (xem được khi chưa đăng nhập)").fill("https://example.com/du-an");
  await student.getByLabel("Link bài chia sẻ công khai").fill("https://facebook.com/post/1");
  await student.getByLabel("Bằng chứng đã nộp 1 đơn ứng tuyển thật").fill("Công ty ABC, vị trí Kế toán công nợ, nộp ngày 20/10 qua TopCV.");
  await student.getByLabel(/File PDF mô tả dự án/).setInputFiles({ name: "du-an.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 e2e") });
  for (const group of await student.getByRole("radiogroup").all()) await group.locator("label").nth(3).click();
  await student.getByRole("button", { name: "Nộp dự án cuối" }).click();
  await expect(student.getByRole("status")).toHaveText(/Đã nộp dự án cuối/);

  const boss = await browser.newPage();
  await signInWithOtp(boss, bossEmail);
  await boss.goto("/nhan-su/du-an");
  await boss.getByRole("link", { name: /Tự động tổng hợp công nợ/ }).first().click();
  await boss.getByLabel(/Giải 1 việc thật/).fill("25");
  await boss.getByLabel(/Chạy được/).fill("25");
  await boss.getByLabel(/Kiểm chứng kết quả/).fill("15");
  await boss.getByLabel(/Trình bày/).fill("15");
  await boss.getByRole("button", { name: "Lưu điểm" }).click();
  // Chấm xong, trang tải lại: form chấm ẩn, lịch sử có điểm.
  await expect(boss.getByText(/· 80\/100 · 25\/25\/15\/15/)).toBeVisible();

  await boss.goto("/truong/chung-nhan?luot=vien");
  const row = boss.getByRole("listitem").filter({ hasText: `ĐH E2E ${studentEmail}` });
  await expect(row).toBeVisible();
  // Chỉ duyệt đúng SV của test này.
  for (const box of await boss.locator("input[name=enrollmentId]").all()) await box.uncheck();
  await row.locator("input[type=checkbox]").check();
  boss.once("dialog", (dialog) => dialog.accept());
  await boss.getByRole("button", { name: /Duyệt các SV đã chọn/ }).click();
  await expect(boss.getByRole("status")).toHaveText(/cấp 1 chứng nhận/);

  await student.goto("/hoc/du-an");
  await expect(student.getByRole("heading", { name: "Chứng nhận đã được cấp" })).toBeVisible();
  await student.getByRole("link", { name: "Xem và in chứng nhận →" }).click();
  await expect(student.getByRole("heading", { name: "Chứng nhận hoàn thành" })).toBeVisible();
  await expect(student.getByLabel("Mã QR xác thực").locator("svg")).toBeVisible();
  const code = (await student.locator("span.font-mono").first().textContent())!.trim();

  const visitor = await browser.newPage();
  await visitor.goto("/xac-thuc");
  await visitor.getByLabel("Mã chứng nhận").fill(code.toLowerCase());
  await visitor.getByRole("button", { name: "Xác thực" }).click();
  await expect(visitor.getByText("✓ Chứng nhận hợp lệ")).toBeVisible();
  await expect(visitor.getByText("Sinh Viên E2E")).toBeVisible();
  // Tên trường E2E có chứa email nên loại ra trước khi kiểm tra.
  const text = (await visitor.locator("main").textContent())!.replace(`ĐH E2E ${studentEmail}`, "");
  expect(text).not.toContain("@");
});
