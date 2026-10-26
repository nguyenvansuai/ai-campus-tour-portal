import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OtpSignInForm } from "@/modules/identity/ui/otp-sign-in-form";

function setup(overrides: Partial<Parameters<typeof OtpSignInForm>[0]> = {}) {
  const props = {
    sendOtp: vi.fn().mockResolvedValue({ error: null }),
    verifyOtp: vi.fn().mockResolvedValue({ error: null }),
    onSignedIn: vi.fn(),
    ...overrides,
  };
  render(<OtpSignInForm {...props} />);
  return { props, user: userEvent.setup() };
}

describe("OtpSignInForm", () => {
  it("bước 1 nhập email, bước 2 nhập mã rồi đăng nhập", async () => {
    const { props, user } = setup();
    await user.type(screen.getByLabelText("Email"), "SV@Example.com");
    await user.click(screen.getByRole("button", { name: "Gửi mã" }));
    expect(props.sendOtp).toHaveBeenCalledWith("sv@example.com");

    expect(await screen.findByText(/Đã gửi mã 6 số tới/)).toHaveTextContent("sv@example.com");
    const code = screen.getByLabelText("Mã 6 số");
    expect(code).toHaveAttribute("autocomplete", "one-time-code");
    expect(code).toHaveAttribute("inputmode", "numeric");

    await user.type(code, "123456");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(props.verifyOtp).toHaveBeenCalledWith("sv@example.com", "123456");
    expect(props.onSignedIn).toHaveBeenCalled();
  });

  it("báo lỗi email không hợp lệ mà không gửi yêu cầu", async () => {
    const { props, user } = setup();
    await user.type(screen.getByLabelText("Email"), "khong-phai-email");
    await user.click(screen.getByRole("button", { name: "Gửi mã" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Email không hợp lệ.");
    expect(props.sendOtp).not.toHaveBeenCalled();
  });

  it("hiện lỗi tiếng Việt khi nhập sai mã và không chuyển trang", async () => {
    const { props, user } = setup({
      verifyOtp: vi.fn().mockResolvedValue({ error: { code: "INVALID_OTP" } }),
    });
    await user.type(screen.getByLabelText("Email"), "sv@example.com");
    await user.click(screen.getByRole("button", { name: "Gửi mã" }));
    await user.type(await screen.findByLabelText("Mã 6 số"), "000000");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Mã không đúng.");
    expect(props.onSignedIn).not.toHaveBeenCalled();
  });

  it("chỉ cho gửi lại mã sau khi đếm ngược xong", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText("Email"), "sv@example.com");
    await user.click(screen.getByRole("button", { name: "Gửi mã" }));
    expect(await screen.findByRole("button", { name: /Gửi lại mã sau \d+ giây/ })).toBeDisabled();
  });

  it("đếm ngược giảm dần mỗi giây rồi mở lại nút gửi lại mã", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const props = {
        sendOtp: vi.fn().mockResolvedValue({ error: null }),
        verifyOtp: vi.fn().mockResolvedValue({ error: null }),
        onSignedIn: vi.fn(),
      };
      render(<OtpSignInForm {...props} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.type(screen.getByLabelText("Email"), "sv@example.com");
      await user.click(screen.getByRole("button", { name: "Gửi mã" }));
      await screen.findByRole("button", { name: /Gửi lại mã sau/ });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(screen.getByRole("button", { name: /Gửi lại mã sau 5[0-7] giây/ })).toBeDisabled();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });
      expect(screen.getByRole("button", { name: "Gửi lại mã" })).toBeEnabled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("cho quay lại sửa email", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText("Email"), "sv@example.com");
    await user.click(screen.getByRole("button", { name: "Gửi mã" }));
    await user.click(await screen.findByRole("button", { name: "Đổi email" }));
    expect(screen.getByLabelText("Email")).toHaveValue("sv@example.com");
  });
});
