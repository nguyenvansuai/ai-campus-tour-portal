// Thư viện nhận xét mẫu: mentor chèn 1 chạm rồi chỉnh cho từng bài.

export const COMMON_TEMPLATES = [
  "Bài làm tốt, đủ tiêu chí. Tiếp tục phát huy ở module sau!",
  "Bạn bổ sung số liệu cụ thể (số phút, số lượng, %) để kết quả thuyết phục hơn.",
  "Link chưa mở được ở chế độ xem. Bạn chỉnh quyền chia sẻ thành \"Bất kỳ ai có đường liên kết – Người xem\" rồi nộp lại.",
  "Phần \"AI sai ở đâu\" còn chung chung. Bạn nêu 1 ví dụ cụ thể và cách bạn kiểm chứng (kèm nguồn).",
  "Ảnh minh chứng còn lộ thông tin cá nhân (email/số điện thoại). Bạn che lại rồi nộp lại.",
];

export const MODULE_TEMPLATES: Record<string, string[]> = {
  M1: [
    "Bản \"Sau\" chưa đủ 5 thành phần (vai trò, bối cảnh, nhiệm vụ, định dạng, tiêu chí). Bạn bổ sung phần còn thiếu.",
    "Global Instruction cần thêm mục tiêu nghề và cách bạn muốn AI trả lời.",
  ],
  M2: [
    "CV cần ít nhất 3 thành tích nêu bằng số. Rà lại để chắc không có thông tin do AI tự thêm.",
    "Thư xin việc chưa nhắc đúng tên vị trí/công ty và 2 yêu cầu chính của tin.",
  ],
  M3: [
    "Thiếu số phút trước/sau. Bạn bấm giờ lại cho cùng một việc để có số đo.",
    "Chưa thấy bước tự động. Bạn tham khảo đường miễn phí (ChatGPT Tasks hoặc kết nối Drive) trong buổi 9.",
  ],
  M4: [
    "Đề bài cần nêu rõ người dùng thật và vấn đề họ đang gặp (mất bao lâu/bao nhiêu tiền).",
    "Portfolio chưa mở được khi chưa đăng nhập. Bạn kiểm tra ở cửa sổ ẩn danh.",
  ],
};
