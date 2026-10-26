# Spec: `project-certificate` (dự án cuối, rubric, chứng nhận QR, xác thực công khai)

> Module P1. Phụ thuộc `review`, `org`. Trạng thái: **đã duyệt theo ủy quyền** (26/10/2026).

## Dự án cuối (M5)
- Mở khi đã nộp báo cáo M4 và học ≥ 14 ngày; hạn ngày 30 (+ gia hạn), không quá hạn cứng ngày 60.
- SV nộp: tên dự án, vấn đề, người dùng, giải pháp, số đo trước/sau, cách kiểm chứng và bảo vệ dữ liệu, link dự án, link bài chia sẻ công khai, bằng chứng đã nộp 1 đơn ứng tuyển thật, **file PDF bắt buộc** (bằng chứng cố định), tự đánh giá cuối khóa (5 câu như M0), cho phép hiện link dự án trên trang xác thực hay không.
- Mentor chấm rubric 4 tiêu chí (30/30/20/20). < 70: Cần sửa (được nộp lại 1 lần; lần 2 vẫn < 70 → Không đạt). 70–89: Đạt. ≥ 90: cần **mentor/admin thứ hai** chấm độc lập, điểm cuối = trung bình 2 lần.

## Chứng nhận
- Đủ điều kiện: 12/12 buổi, 4/4 báo cáo Đạt, dự án ≥ 70, đạt trắc nghiệm M1–M3.
- Đơn vị cấp: trường **đã kết nối** → Trường + Viện ĐT Bách Khoa (cần 2 lượt duyệt: QL trường hoặc admin; Viện hoặc admin). Trường khác → chỉ Viện.
- Duyệt theo lô tại `/truong/chung-nhan`. Khi đủ lượt duyệt: sinh mã 10 ký tự, hồ sơ học chuyển `completed`, gửi email.
- `/chung-nhan/[mã]`: bản in (In → Lưu PDF), có QR trỏ tới `/xac-thuc/[mã]`.
- `/xac-thuc/[mã]` (công khai): họ tên, trường, đơn vị cấp, ngày cấp, xếp loại, tên dự án (link dự án nếu SV cho phép). Không hiện email/SĐT. Chứng nhận bị thu hồi hiện rõ "Đã thu hồi".

## Success Criteria
1. Chấm chéo bắt buộc khi ≥ 90; người chấm thứ hai phải khác người thứ nhất.
2. Không đủ điều kiện thì không vào danh sách duyệt.
3. Trường đã kết nối cần đủ 2 lượt duyệt; trường khác chỉ cần Viện.
4. Trang xác thực không lộ email/SĐT.
