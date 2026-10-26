import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/(public)/page";
import { SiteFooter } from "@/components/brand/site-footer";

describe("Thương hiệu người sáng lập", () => {
  it("trang chủ có mục người sáng lập với ảnh và giới thiệu", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Người sáng lập" })).toBeInTheDocument();
    expect(screen.getByAltText("Nguyễn Văn Sự (Sự AI)")).toHaveAttribute("src", expect.stringContaining("/brand/nguyen-van-su.webp"));
    expect(screen.getByText(/Nguyễn Văn Sự/, { selector: "p" })).toBeInTheDocument();
  });

  it("chân trang có logo Sự AI dẫn tới suai.vn", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/Sáng lập và tài trợ phát triển bởi/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Sự AI" });
    expect(link).toHaveAttribute("href", "https://www.suai.vn");
    expect(screen.getByAltText("Sự AI")).toHaveAttribute("src", expect.stringContaining("/brand/suai-logo.png"));
  });
});
