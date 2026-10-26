import { expect, test } from "@playwright/test";
import { makeSuperAdmin } from "./support/db";
import { signInWithOtp } from "./support/login";
import { completeLessonViaUi, enrollStudent } from "./support/student";

test.setTimeout(120_000);

test("SV học 3 buổi, làm trắc nghiệm, nộp báo cáo; admin chấm Cần sửa; SV thấy nhận xét", async ({ browser }) => {
  const stamp = Date.now();
  const studentEmail = `hoc-${stamp}@example.com`;
  const bossEmail = `boss-hoc-${stamp}@example.com`;
  makeSuperAdmin(bossEmail);

  const student = await browser.newPage();
  await enrollStudent(student, studentEmail);
  await expect(student.getByRole("heading", { name: /Ngày 0\/30/ })).toBeVisible();

  // Buổi học hiển thị đủ phần để tự học.
  await student.goto("/hoc/buoi/1");
  for (const heading of ["Mục tiêu", "Kiến thức cốt lõi", "Học ở đâu (chọn 1 nguồn là đủ)", "Các bước tự làm", "Prompt mẫu", "Bài đạt chuẩn trông như thế nào"]) {
    await expect(student.getByRole("heading", { name: heading })).toBeVisible();
  }
  await expect(student.getByText("Tham khảo").first()).toBeVisible();

  for (const n of [1, 2, 3]) await completeLessonViaUi(student, n);
  await student.goto("/hoc");
  await expect(student.getByText("3/12 buổi đã hoàn thành")).toBeVisible();

  // Trắc nghiệm: nộp bỏ trống để thấy chấm và giải thích.
  await student.goto("/hoc/trac-nghiem/M1");
  await student.getByRole("button", { name: "Bắt đầu làm bài" }).click();
  student.once("dialog", (dialog) => dialog.accept());
  await student.getByRole("button", { name: "Nộp bài" }).click();
  await expect(student.getByRole("status")).toContainText("Chưa đạt");

  // Báo cáo module tự gom minh chứng.
  await student.goto("/hoc/bao-cao/M1");
  await expect(student.getByLabel(/Bài đã học tuần này/)).toHaveValue(/Buổi 1/);
  await student.getByRole("button", { name: "Nộp báo cáo" }).click();
  await expect(student.getByRole("status")).toContainText("Đã nộp báo cáo");
  await student.goto("/hoc");
  await expect(student.getByRole("link", { name: /Buổi 4:/ }).first()).toBeVisible();

  // Admin chấm Cần sửa.
  const boss = await browser.newPage();
  await signInWithOtp(boss, bossEmail);
  await boss.goto("/nhan-su?tat_ca=1");
  await boss.getByRole("link", { name: /M1 · Sinh Viên E2E/ }).first().click();
  await boss.getByRole("checkbox").first().check();
  await boss.getByLabel(/Nhận xét/).fill("Bạn bổ sung bản Sau đủ 5 thành phần.");
  await boss.getByRole("button", { name: "Lưu kết quả chấm" }).click();
  // Sau khi chấm, form chấm đóng lại và lịch sử hiện kết quả.
  await expect(boss.getByText(/Mentor: Cần sửa \(v1\)/)).toBeVisible();

  await student.goto("/hoc/bao-cao/M1");
  await expect(student.getByText("Mentor: Cần sửa", { exact: false })).toBeVisible();
  await expect(student.getByText("Bạn bổ sung bản Sau đủ 5 thành phần.")).toBeVisible();
});
