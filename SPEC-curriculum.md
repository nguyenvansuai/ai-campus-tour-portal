# Spec: `curriculum` (lộ trình 30 ngày: module, buổi học, nguồn học, trắc nghiệm, tiêu chí)

> Module P0. Không phụ thuộc module khác. Trạng thái: **đã duyệt theo ủy quyền** (26/10/2026).
> Nội dung bám **Đề cương full chương trình** (`docs/md/De_cuong_full_chuong_trinh_AI_campus_tour.md`) và `docs/THIET_KE_CHUONG_TRINH.md`, `docs/NGUON_HOC_BO_SUNG.md`.

## Objective

Cung cấp nội dung đủ để **SV đại học tự học được** trong 30 ngày, không cần giảng viên đứng lớp:
- Mỗi buổi có: mục tiêu, vì sao cần học, kiến thức cốt lõi (ngắn), **các bước làm cụ thể**, **prompt mẫu sao chép được**, **ví dụ bài đạt chuẩn**, lỗi hay gặp, câu tự kiểm tra, lưu ý an toàn, minh chứng phải nộp, thời lượng ước tính.
- Nguồn học hiển thị ngang hàng theo cột "Học ở đâu" của đề cương; N1 (khóa Sự AI) là **tham khảo**, ghi số chủ đề.
- Buổi 4–6 và 9 có **đường miễn phí** (không cần add-in trả phí).
- Trắc nghiệm kiến thức M1–M3 (chấm tự động theo đáp án cố định), tiêu chí Đạt của 4 báo cáo, rubric dự án cuối.

## Quyết định thiết kế

- **Nội dung là dữ liệu trong code** (`src/modules/curriculum/content/`), có phiên bản (`PROGRAM_VERSION`). Đội nội dung sửa qua GitHub (xem lịch sử, duyệt từng thay đổi). Hồ sơ học của SV lưu mã phiên bản lúc đăng ký nên sửa nội dung không làm rối SV đang học. Trình soạn nội dung trên giao diện web để sau (P2).
- Test tự động kiểm tra tính đầy đủ của nội dung: mỗi buổi đủ các phần; mỗi buổi (trừ buổi 10) có ≥ 2 nguồn; mỗi câu trắc nghiệm có đúng 1 đáp án; mọi mã nguồn học tồn tại trong danh mục.
- Link nguồn học có `lastChecked`; trang admin liệt kê nguồn quá 90 ngày chưa kiểm tra.

## Ngoài phạm vi
Giao diện học của SV (module `learning`), lịch hạn nộp (module `enrollment`), chấm bài (module `review`).

## Success Criteria
1. 6 module (M0–M5), 12 buổi, buổi 7–9 có 3 nhánh A/B/C, đủ các phần nêu trên.
2. Ngân hàng trắc nghiệm: M1 ≥ 15 câu (gồm an toàn dữ liệu), M2 ≥ 10, M3-AB ≥ 10, M3-C ≥ 10.
3. Test tính đầy đủ nội dung pass.
