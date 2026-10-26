/** Tên hành động trong nhật ký, hiển thị bằng tiếng Việt. Hành động chưa có tên thì hiện mã gốc. */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "staff.invited": "Mời nhân sự",
  "role.granted": "Cấp vai trò",
  "role.revoked": "Thu hồi vai trò",
  "user.suspended": "Khóa tài khoản",
  "user.reactivated": "Mở khóa tài khoản",
  "session.revoked_all": "Đăng xuất mọi thiết bị",
  "consent.granted": "Đồng ý điều khoản",
  "consent.withdrawn": "Rút đồng ý",
};
