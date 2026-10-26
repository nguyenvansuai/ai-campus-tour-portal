import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GoogleSignInButton } from "@/modules/identity/ui/google-sign-in-button";

describe("GoogleSignInButton", () => {
  it("bấm nút thì bắt đầu đăng nhập Google và quay về trang học", async () => {
    const signIn = vi.fn().mockResolvedValue({ error: null });
    render(<GoogleSignInButton signIn={signIn} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Tiếp tục với Google" }));
    expect(signIn).toHaveBeenCalledWith("/hoc");
  });

  it("hiện lỗi tiếng Việt nếu không mở được Google", async () => {
    const signIn = vi.fn().mockResolvedValue({ error: { status: 500 } });
    render(<GoogleSignInButton signIn={signIn} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Tiếp tục với Google" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Có lỗi xảy ra. Vui lòng thử lại.");
  });
});
