# Todo: module `course-integration`

- [x] Task 1: Bảng course_credit (theo email), voucher + migration 0012; quyền course.record (admin/mentor/TA), course.manage_vouchers (admin)
- [x] Task 2: API `POST /api/tich-hop/suai/hoan-thanh` ký HMAC + chống replay (±5 phút) + idempotent theo eventId
- [x] Task 3: Miễn trắc nghiệm: M2, M3 (A/B) miễn hẳn; M1 còn bài M1-SAFE (an toàn dữ liệu); khối C vẫn làm M3; điều kiện chứng nhận tính miễn
- [x] Task 4: Xác nhận tay lớp meet.suai.vn + thu hồi (/nhan-su/khoa-su-ai)
- [x] Task 5: Mã ưu đãi (suất miễn phí cho SV workshop, giảm 50%); nhận mã không trùng (SKIP LOCKED)
- [x] Task 6: Plugin WordPress `integrations/wordpress/aict-bridge` (hook tutor_course_complete_after, hàng đợi gửi lại, trang cài đặt, nút kiểm tra kết nối)
- [x] Sửa kèm: biến môi trường để trống trong .env được coi như chưa đặt (tránh lỗi khởi động trên VPS)
- [x] Checkpoint: lint, typecheck, test (320), build, E2E (16)
- [ ] Ngoài phạm vi (cần đội Sự AI xác nhận): báo theo từng bài học, SSO 1 chạm, ghi danh tự động
