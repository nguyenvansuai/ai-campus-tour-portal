import { describe, expect, it } from "vitest";
import { renderOtpEmail } from "@/lib/email";

describe("renderOtpEmail", () => {
  it("có mã, thời hạn và lời nhắc không chia sẻ mã", () => {
    const mail = renderOtpEmail("123456");
    expect(mail.subject).toBe("Mã đăng nhập AI Campus Tour: 123456");
    expect(mail.text).toContain("123456");
    expect(mail.text).toContain("10 phút");
    expect(mail.text).toMatch(/không chia sẻ/i);
    expect(mail.html).toContain("123456");
  });
});
