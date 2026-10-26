import { describe, expect, it } from "vitest";
import { describeAuthError } from "@/modules/identity/ui/auth-errors";

describe("describeAuthError", () => {
  it.each([
    [{ code: "INVALID_OTP" }, "Mã không đúng. Vui lòng kiểm tra lại."],
    [{ code: "OTP_EXPIRED" }, "Mã đã hết hạn. Vui lòng bấm \"Gửi lại mã\"."],
    [{ code: "TOO_MANY_ATTEMPTS" }, "Bạn đã nhập sai quá nhiều lần. Vui lòng bấm \"Gửi lại mã\"."],
    [{ status: 429 }, "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút."],
  ])("dịch lỗi %o sang tiếng Việt", (error, message) => {
    expect(describeAuthError(error)).toBe(message);
  });

  it("giữ nguyên thông báo tài khoản bị khóa từ server", () => {
    expect(
      describeAuthError({ status: 403, message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban tổ chức." }),
    ).toBe("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban tổ chức.");
  });

  it("lỗi không xác định thì hiện thông báo chung, không lộ chi tiết kỹ thuật", () => {
    expect(describeAuthError({ status: 500, message: "relation \"user\" does not exist" })).toBe(
      "Có lỗi xảy ra. Vui lòng thử lại.",
    );
  });
});
