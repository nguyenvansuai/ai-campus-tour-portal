/** Các trường SV điền khi nộp dự án cuối (Đề cương mục 6). PDF bắt buộc nộp kèm. */
export const FINAL_FIELDS = [
  { key: "title", label: "Tên dự án", type: "text", minLength: 5, hint: "Ví dụ: Tự động tổng hợp công nợ khách hàng hằng tuần" },
  { key: "problem", label: "Vấn đề thật cần giải", type: "textarea", minLength: 50, hint: "Việc gì, ai gặp, hiện mất bao lâu, sai ở đâu." },
  { key: "users", label: "Ai dùng sản phẩm này", type: "text", minLength: 5, hint: "Ví dụ: Nhân viên kế toán công nợ ở công ty 50 người" },
  { key: "solution", label: "Giải pháp: quy trình và công cụ AI bạn dùng", type: "textarea", minLength: 80, hint: "Các bước, công cụ, prompt chính, bước nào tự động." },
  { key: "beforeAfter", label: "Số đo trước/sau", type: "text", minLength: 5, hint: "Ví dụ: 90 phút → 20 phút mỗi tuần, đo trên 3 lần chạy" },
  { key: "verification", label: "Cách kiểm chứng kết quả và bảo vệ dữ liệu", type: "textarea", minLength: 50, hint: "Bạn thử với dữ liệu nào, phát hiện lỗi gì, che thông tin gì." },
  { key: "projectUrl", label: "Link dự án (xem được khi chưa đăng nhập)", type: "link", minLength: 0, hint: "Trang portfolio, Google Drive chia sẻ công khai, GitHub…" },
  { key: "shareUrl", label: "Link bài chia sẻ công khai", type: "link", minLength: 0, hint: "Bài đăng Facebook/LinkedIn kể lại dự án của bạn." },
  { key: "applicationProof", label: "Bằng chứng đã nộp 1 đơn ứng tuyển thật", type: "textarea", minLength: 20, hint: "Công ty, vị trí, ngày nộp, link tin tuyển dụng." },
] as const;

export type FinalFieldKey = (typeof FINAL_FIELDS)[number]["key"];

export const INSTITUTE_NAME = "Viện Đào tạo Bách Khoa";

export const FINAL_STATUS_LABELS = {
  submitted: "Chờ chấm",
  awaiting_second: "Chờ chấm lần 2",
  needs_revision: "Cần sửa",
  passed: "Đạt",
  failed: "Không đạt",
} as const;

export const GRADE_LABELS = { completed: "Hoàn thành", excellent: "Xuất sắc" } as const;
