# Spec: `enrollment` (đăng ký, onboarding M0, lịch 30 ngày cá nhân)

> Module P0. Phụ thuộc `identity`, `org`, `curriculum`. Trạng thái: **đã duyệt theo ủy quyền** (26/10/2026).

## Objective
SV đăng ký tự do (có hoặc không có mã workshop), khai báo thông tin trong < 3 phút trên điện thoại, và từ đó có **lịch 30 ngày riêng** tính từ ngày đăng ký.

## Luồng
1. `/bat-dau?ma=XXXX` (hoặc `/bat-dau`): chưa đăng nhập → `/dang-nhap?next=/bat-dau?ma=XXXX` → quay lại.
2. Form onboarding (M0), một trang, chia 4 phần: **Thông tin** (họ tên, SĐT tùy chọn, MSSV), **Trường** (chọn từ danh sách – mã workshop điền sẵn trường; hoặc "Trường của tôi chưa có" → nhập tên → trường chờ xác minh; khoa chọn/nhập; lớp nhập), **Mục tiêu** (khối A/B/C, vị trí mong muốn, công cụ AI đang có), **Tự đánh giá** 5 câu thang 1–5, **Đồng ý điều khoản** (2 ô bắt buộc + 3 tùy chọn).
3. Gửi → tạo hồ sơ học, dùng 1 lượt mã (nếu có), ghi đồng ý, tự phân công mentor/TA có ít SV nhất → vào `/hoc`.

## Lịch và trạng thái
- Ngày 0 = ngày đăng ký (giờ Việt Nam). Hạn báo cáo M1–M4: 23:59 ngày 7/14/21/28; dự án cuối 23:59 ngày 30.
- **Gia hạn**: +7 ngày, tối đa 1 lần. **Bảo lưu**: tối đa 14 ngày, đồng hồ dừng. Do TA/mentor phụ trách hoặc admin thực hiện.
- **Hạn cứng**: ngày 60 kể từ ngày đăng ký (đã tính cả gia hạn, bảo lưu).
- Trạng thái: `active`, `paused`, `inactive` (21 ngày không hoạt động – job module notifications đặt), `completed`, `failed`.
- Mỗi SV chỉ có 1 hồ sơ đang mở.
- Khối ngành đổi được tới trước ngày 15.

## Quyền
- SV xem/sửa hồ sơ của mình (đổi khối trước ngày 15).
- `enrollment.adjust` (gia hạn, bảo lưu): admin, mentor/TA được phân công.

## Success Criteria
1. Đăng ký có mã: trường điền sẵn, mã bị trừ 1 lượt; mã sai/hết hạn → báo lỗi, vẫn đăng ký được không cần mã.
2. Thiếu ô đồng ý bắt buộc → không tạo hồ sơ.
3. Lịch tính đúng cả khi có gia hạn và bảo lưu (unit test bảng ca).
4. Đã có hồ sơ đang mở thì `/bat-dau` chuyển về `/hoc`.
