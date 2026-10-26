import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/(public)/page";

describe("Trang chủ", () => {
  it("hiển thị tên chương trình và người sáng lập", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1, name: "AI Campus Tour" })).toBeInTheDocument();
    expect(screen.getByText("Sáng lập bởi Sự AI")).toBeInTheDocument();
  });

  it("có nút dẫn tới trang đăng nhập", () => {
    render(<HomePage />);
    expect(screen.getByRole("link", { name: "Bắt đầu học" })).toHaveAttribute("href", "/dang-nhap");
  });
});
