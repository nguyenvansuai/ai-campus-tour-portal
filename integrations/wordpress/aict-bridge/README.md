# AICT Bridge (plugin WordPress cho suai.vn)

Báo về portal khi học viên **hoàn thành khóa Sự AI** trên Tutor LMS (bản Free có hook `tutor_course_complete_after`). Portal dùng tín hiệu này để miễn trắc nghiệm cho SV (xem `SPEC-course-integration.md`).

## Cài đặt
1. Nén thư mục `aict-bridge` thành `aict-bridge.zip` → WordPress: **Plugin → Cài mới → Tải plugin lên** → Kích hoạt.
2. Trên VPS portal, tạo secret: `openssl rand -hex 32`, đặt vào `SUAI_BRIDGE_SECRET` trong `.env.production`, khởi động lại portal.
3. WordPress: **Cài đặt → AICT Bridge**: URL portal `https://aicampustour.suai.vn`, dán secret, giữ ID khóa `3584,3599` → Lưu → bấm **Kiểm tra kết nối**.
   - Có thể đặt secret trong `wp-config.php`: `define('AICT_BRIDGE_SECRET', '...');`

## Hoạt động
- Học viên hoàn thành khóa 3584/3599 → plugin gửi `POST /api/tich-hop/suai/hoan-thanh` có ký HMAC-SHA256 (`timestamp.body`).
- Lỗi mạng → lưu hàng đợi, WP-Cron gửi lại mỗi giờ.
- Portal ghi theo **email**: SV nên dùng cùng email trên suai.vn và portal. Nếu khác email, mentor/TA xác nhận tay tại `/nhan-su/khoa-su-ai`.
- Lớp trên meet.suai.vn không qua plugin: mentor/TA xác nhận tay.
