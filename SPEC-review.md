# Spec: `review` (kiểm hồ sơ, chấm báo cáo module, kiểm ngẫu nhiên minh chứng)

> Module P0. Phụ thuộc `learning`. Trạng thái: **đã duyệt theo ủy quyền** (26/10/2026). 100% do người chấm, không dùng AI.

## Luồng
`SV nộp báo cáo (submitted)` → **TA kiểm hồ sơ** (không bắt buộc): đủ → `prechecked`; thiếu → `returned` (SV nộp lại) → **Mentor chấm** theo checklist tiêu chí của module: đạt hết → `passed`; thiếu tiêu chí → `needs_revision` (bắt buộc ghi nhận xét) → SV sửa, nộp lại (phiên bản mới, ưu tiên trong hàng đợi).

## Màn hình nhân sự
- `/nhan-su`: hàng đợi (mặc định: bài được phân công cho tôi; admin xem tất cả), sắp theo hạn phản hồi (nộp + 3 ngày), đánh dấu **quá hạn**, lọc theo module/trạng thái.
- `/nhan-su/bao-cao/[id]`: thông tin SV, 5 trường báo cáo, minh chứng từng buổi (link, file xem qua portal, phản tư), lịch sử chấm; form kiểm hồ sơ (TA) hoặc checklist + nhận xét + **nhận xét mẫu** chèn 1 chạm (mentor).
- Kiểm ngẫu nhiên minh chứng buổi học: TA đánh dấu Hợp lệ / Không hợp lệ (bỏ tích buổi đó, SV phải nộp lại).

## Quyền
`submission.precheck` (TA, mentor được phân công), `submission.review` (mentor được phân công), admin mọi bài.

## Success Criteria
1. Chỉ mentor được phân công (hoặc admin) chấm được; TA chỉ kiểm hồ sơ.
2. Đạt hết tiêu chí → passed; thiếu → needs_revision kèm nhận xét bắt buộc.
3. SV thấy nhận xét và tiêu chí chưa đạt trên trang báo cáo.
4. Hàng đợi sắp theo hạn, hiện bài quá hạn phản hồi.
