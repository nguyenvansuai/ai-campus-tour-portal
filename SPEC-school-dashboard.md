# Spec: `school-dashboard` (tiến độ theo trường/khoa/lớp, chi tiết SV, xuất CSV)

> Module P0. Phụ thuộc `enrollment`, `learning`, `review`. Trạng thái: **đã duyệt theo ủy quyền** (26/10/2026).

## Objective
Giáo viên, quản lý trường, Viện ĐT Bách Khoa và nhân sự thấy nhanh tình hình SV **trong phạm vi được phép**: bao nhiêu SV đang học, ai chậm, ai đã đạt.

## Màn hình
- `/truong`: thẻ tổng (đăng ký, đang hoạt động 7 ngày, trung bình số buổi, báo cáo Đạt, hoàn thành) + bảng theo khoa → lớp; lọc theo trường (người xem nhiều trường), khoa, trạng thái; danh sách SV (tên, lớp, ngày N/30, x/12 buổi, báo cáo, lần hoạt động cuối, cờ "có nguy cơ" khi ≥ 7 ngày không hoạt động).
- `/truong/xuat-csv`: xuất danh sách SV đang lọc (UTF-8 có BOM, mở được bằng Excel).
- `/truong/sinh-vien/[id]`: tiến độ từng buổi, trạng thái báo cáo, hạn nộp; nút **Gia hạn +7 ngày**, **Bảo lưu / Tiếp tục** cho người có quyền `enrollment.adjust`.

## Quyền
Danh sách luôn lọc bằng `scopeFilter` ở tầng truy vấn (trường/khoa/lớp được gán, SV được phân công, hoặc tất cả với admin/Viện). Trang chi tiết kiểm tra `student_record.view`.

## Success Criteria
1. GV khoa A không thấy SV khoa B; QL trường chỉ thấy trường mình; Viện thấy mọi trường.
2. CSV mở bằng Excel hiển thị đúng tiếng Việt.
3. Gia hạn/bảo lưu hoạt động từ trang chi tiết với TA/mentor phụ trách.
