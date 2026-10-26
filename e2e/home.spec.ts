import { expect, test } from "@playwright/test";

test("trang chủ hiển thị trên điện thoại và dẫn tới đăng nhập", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "AI Campus Tour" })).toBeVisible();
  await expect(page.getByText("Sáng lập bởi Sự AI")).toBeVisible();

  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalScroll).toBe(false);

  await expect(page.getByRole("link", { name: "Bắt đầu học" })).toHaveAttribute("href", "/dang-nhap");
});
