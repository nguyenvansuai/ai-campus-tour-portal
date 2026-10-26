# Spec: `live-sessions` (giờ hỗ trợ trên meet.suai.vn)

> Module P2. Phụ thuộc `identity`, `enrollment`. Trạng thái: **đã duyệt theo ủy quyền** (26/10/2026).

## Objective
Mentor/TA mở giờ hỗ trợ trực tuyến cố định (vd. tối thứ 3, thứ 6) trên meet.suai.vn để SV hỏi trực tiếp. SV thấy lịch trên portal, bấm "Tham gia" là vào phòng; portal ghi điểm danh.

## Quy tắc
- Mentor/TA/admin tạo buổi: tiêu đề, thời gian bắt đầu (giờ Việt Nam), thời lượng (30–180 phút), ghi chú. Có thể tạo lặp hằng tuần tối đa 8 buổi. Hủy buổi được.
- Tên phòng ngẫu nhiên, khó đoán (`aict-ho-tro-<mã>`), tránh người ngoài vào khi meet.suai.vn chưa bật JWT.
- Vào phòng qua `/hoc/ho-tro/[id]/vao`: phải đăng nhập; SV phải có hồ sơ học đang mở; mở từ 15 phút trước giờ bắt đầu tới hết buổi. Lần vào đầu tiên được ghi điểm danh.
- Nếu đặt `JITSI_APP_ID` + `JITSI_APP_SECRET`: portal ký JWT HS256 (Prosody token auth): `aud=jitsi`, `iss=APP_ID`, `sub=JITSI_DOMAIN`, `room`, `exp` = hết buổi + 1 giờ, `context.user` (tên, email), `moderator` = true với nhân sự. Không đặt thì mở link phòng thường.

## Màn hình
| Đường dẫn | Ai | Nội dung |
|---|---|---|
| `/hoc/ho-tro` | SV | Lịch 14 ngày tới, nút Tham gia khi tới giờ, buổi đã tham gia |
| `/nhan-su/ho-tro` | mentor, TA, admin | Tạo buổi (lặp tuần), danh sách sắp tới, hủy, số người tham gia, danh sách điểm danh |

## Success Criteria
1. Chưa tới giờ / buổi đã hủy / đã kết thúc → không vào được, báo tiếng Việt.
2. Điểm danh ghi 1 lần mỗi người mỗi buổi.
3. JWT đúng cấu trúc, nhân sự là moderator, SV không.
4. SV không tạo/hủy buổi được.
