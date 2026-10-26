export type AuthErrorLike = { code?: string; status?: number; message?: string } | null | undefined;

const BY_CODE: Record<string, string> = {
  INVALID_OTP: "Mã không đúng. Vui lòng kiểm tra lại.",
  OTP_EXPIRED: 'Mã đã hết hạn. Vui lòng bấm "Gửi lại mã".',
  TOO_MANY_ATTEMPTS: 'Bạn đã nhập sai quá nhiều lần. Vui lòng bấm "Gửi lại mã".',
};

/** Đổi lỗi từ Better Auth sang câu tiếng Việt cho người dùng; không hiện chi tiết kỹ thuật. */
export function describeAuthError(error: AuthErrorLike): string {
  if (error?.code && BY_CODE[error.code]) return BY_CODE[error.code];
  // Các lỗi do chính portal ném ra đã có thông báo tiếng Việt (vd. số phút phải chờ).
  if (error?.code === "OTP_SEND_LIMIT" && error.message) return error.message;
  if (error?.status === 429) return "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.";
  // Lỗi 403 do chính portal ném ra (tài khoản bị khóa) đã có thông báo tiếng Việt.
  if (error?.status === 403 && error.message) return error.message;
  return "Có lỗi xảy ra. Vui lòng thử lại.";
}
