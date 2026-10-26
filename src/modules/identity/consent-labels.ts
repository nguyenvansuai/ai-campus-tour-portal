import type { ConsentKey } from "./consent-keys";

// Theo docs/DIEU_KHOAN_DU_LIEU.md, mục B.
export const CONSENT_LABELS: Record<ConsentKey, string> = {
  data_processing:
    "Tôi đã đọc và đồng ý với việc xử lý dữ liệu cá nhân theo Điều khoản, bao gồm việc lưu file bài nộp trên Google Drive và gửi email qua Brevo (máy chủ có thể ở nước ngoài).",
  share_with_school: "Tôi đồng ý để trường của tôi và Viện Đào tạo Bách Khoa xem tiến độ và kết quả học tập của tôi.",
  sponsor_referral: "Tôi đồng ý để chương trình giới thiệu hồ sơ và dự án của tôi tới doanh nghiệp tài trợ/nhà tuyển dụng nếu tôi đạt loại Xuất sắc.",
  anonymized_samples: "Tôi đồng ý để bài làm đạt chuẩn của tôi được dùng làm bài mẫu ẩn danh cho các khóa sau.",
  zalo_notifications: "Tôi muốn nhận thông báo qua Zalo (cần số điện thoại).",
};
