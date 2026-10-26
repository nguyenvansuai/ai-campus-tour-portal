# Spec: `notifications` (nhắc nhở, báo kết quả, chuyển trạng thái theo lịch)

> Module P0. Phụ thuộc `enrollment`, `learning`, `review`. Trạng thái: **đã duyệt theo ủy quyền** (26/10/2026).

## Thiết kế
- Tiến trình `pnpm jobs:run` chạy mỗi 15 phút (service `worker` trong docker-compose). Mỗi quy tắc gửi **đúng 1 lần** cho mỗi mốc nhờ bảng `notification_log` (unique theo người nhận + loại + mốc).
- Kênh: email (Brevo). Nếu đặt `NOTIFY_WEBHOOK_URL`, portal gửi thêm sự kiện JSON có chữ ký HMAC sang n8n (n8n gửi Zalo cho SV đã đồng ý nhận Zalo và có số điện thoại).

## Quy tắc
| Mã | Khi nào | Gửi ai |
|---|---|---|
| `due_soon` | Còn ≤ 24 giờ tới hạn báo cáo module mà chưa nộp | SV |
| `overdue` | Quá hạn báo cáo mà chưa nộp | SV |
| `inactive_7` | 7 ngày không hoạt động | SV |
| `ta_alert_14` | 14 ngày không hoạt động | TA phụ trách |
| `review_result` | Có kết quả kiểm hồ sơ (trả lại) hoặc chấm (Đạt/Cần sửa) | SV |
| `review_overdue` | Bài chờ chấm quá hạn phản hồi | Mentor phụ trách |
| — | 21 ngày không hoạt động → trạng thái `inactive`; quá hạn cứng ngày 60 → `failed` | — |

## Success Criteria
1. Chạy job nhiều lần không gửi trùng.
2. Mỗi quy tắc có test với thời gian giả lập.
3. Email tiếng Việt, có link về đúng trang.
