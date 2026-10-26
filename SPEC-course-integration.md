# Spec: `course-integration` (khóa Sự AI – N1: suai.vn + meet.suai.vn)

> Module P2. Phụ thuộc `identity`, `learning`. Trạng thái: **đã duyệt theo ủy quyền** (26/10/2026).
> Nguyên tắc (docs/THIET_KE_CHUONG_TRINH.md 2.4): N1 chỉ giúp **miễn trắc nghiệm**, không thay sản phẩm và báo cáo module.

## Ghi nhận học N1
| Nguồn | Cách ghi nhận |
|---|---|
| Khóa video (Tutor LMS Free, suai.vn, khóa 3584) | Plugin `aict-bridge` gọi `POST /api/tich-hop/suai/hoan-thanh` khi SV **hoàn thành cả khóa** (hook `tutor_course_complete_after`) |
| Lớp trực tuyến (meet.suai.vn, khóa 3599) | Nhân viên portal (admin/mentor/TA) xác nhận tay tại `/nhan-su/khoa-su-ai`, chọn module đã học (M1/M2/M3) |

- Ghi theo **email** (chữ thường) nên SV học N1 trước rồi mới đăng ký portal vẫn được tính.
- API: body JSON `{event:"course_completed", eventId, email, courseId, completedAt}`; header `x-aict-timestamp` (giây Unix, lệch ≤ 5 phút) và `x-aict-signature` = hex HMAC-SHA256(`SUAI_BRIDGE_SECRET`, `${timestamp}.${body}`). Trùng `eventId` → bỏ qua (idempotent). Chỉ nhận khóa trong `SUAI_COURSE_IDS` (mặc định `3584,3599`).
- Ghi nhận tay có thể thu hồi (ghi lý do, có nhật ký).

## Miễn trắc nghiệm
- Đã chốt: suai.vn chỉ báo 1 lần khi SV hoàn thành cả khóa (không báo theo từng bài học).
- M2: miễn hẳn. M3: miễn với khối A/B; **khối C không miễn**.
- M1: phần **an toàn dữ liệu vẫn bắt buộc** → SV được miễn làm bài ngắn `M1-SAFE` (4 câu, đạt ≥ 75%).
- Trang học và điều kiện chứng nhận dùng chung quy tắc này.

## Mã ưu đãi khóa Sự AI
- Admin dán danh sách mã (mỗi dòng 1 mã) theo loại: **Suất miễn phí** (khóa video) hoặc **Giảm 50%**. Mã tạo sẵn trên suai.vn.
- SV nhận tối đa 1 mã mỗi loại. Suất miễn phí chỉ dành cho SV đăng ký bằng mã workshop. Hết mã thì báo hết suất.

## Màn hình
| Đường dẫn | Ai | Nội dung |
|---|---|---|
| `/hoc/khoa-su-ai` | SV | Giới thiệu N1 (tùy chọn), trạng thái ghi nhận, nhận mã ưu đãi |
| `/nhan-su/khoa-su-ai` | admin, mentor, TA (mã ưu đãi: admin) | Xác nhận tay, danh sách ghi nhận + thu hồi, nhập mã, thống kê mã |

## Success Criteria
1. Chữ ký sai/quá hạn → 401; trùng eventId không ghi 2 lần.
2. SV đã học N1 được miễn M2, M3 (A/B); khối C vẫn phải làm M3; M1 chỉ còn bài an toàn dữ liệu.
3. Thu hồi ghi nhận → mất miễn.
4. Mỗi SV nhận tối đa 1 mã/loại; 2 SV không nhận trùng mã.
