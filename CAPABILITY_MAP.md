# Capability Map: Portal AI Campus Tour

> Phase 0 của quy trình spec-driven (agent-skills). Bản đồ này là **mục lục** của các spec: mỗi module có một file `SPEC-<module-id>.md` riêng, viết theo đúng thứ tự xây dựng bên dưới.
> Thiết kế nghiệp vụ: `docs/PORTAL_PHAC_THAO.md`, `docs/THIET_KE_CHUONG_TRINH.md`, `docs/NGUON_HOC_BO_SUNG.md`.

## Giả định kỹ thuật (sửa ngay nếu sai, nếu không tôi sẽ theo)

1. **Một ứng dụng Next.js duy nhất** (App Router, TypeScript), chưa tách monorepo. Plugin WordPress để thư mục riêng khi tới P2.
2. **PostgreSQL 16 + Drizzle ORM**; **Better Auth** cho đăng nhập (email OTP/magic link + Google).
3. **Tailwind + shadcn/ui**, giao diện **chỉ tiếng Việt**, mobile-first.
4. **Múi giờ Asia/Ho_Chi_Minh**: mọi hạn nộp là 23:59 giờ Việt Nam.
5. **Test:** Vitest (unit/integration, dùng Postgres thật trong Docker) + Playwright (luồng chính). Có bộ test riêng cho **ma trận phân quyền**.
6. **Trình quản lý gói:** pnpm. **Deploy:** Docker Compose + Caddy trên VPS, CI bằng GitHub Actions.
7. **Email:** gửi qua SMTP; nhắc nhở bắn webhook sang n8n.
8. **File minh chứng: lưu trên Google Drive** [Chốt]. SV nộp link (Drive/Docs/Sheets/GitHub…) hoặc tải file lên portal; portal đẩy file vào Drive của dự án qua Google Drive API và chỉ lưu `fileId`. Code đi qua một lớp lưu trữ trừu tượng (`StorageProvider`), để sau này đổi nơi lưu không phải sửa nghiệp vụ.

## Các module

| Module id | Trách nhiệm | Phụ thuộc | Giai đoạn |
|---|---|---|---|
| `identity` | Tài khoản, đăng nhập, vai trò (Super Admin, Admin VH, Mentor, TA, QL trường, GV trường, SV), **phạm vi dữ liệu** và lớp kiểm tra quyền | — | P0 |
| `org` | Trường (cờ *đã kết nối*), khoa, lớp, sự kiện workshop, mã kích hoạt; phân công GV/QL trường | identity | P0 |
| `curriculum` | Chương trình có phiên bản → module → 12 buổi (nhánh A/B/C) → minh chứng yêu cầu; thư viện nguồn học N1–N11 (thẻ nguồn, mức phí, điều kiện); ngân hàng trắc nghiệm; tiêu chí Đạt | — | P0 |
| `enrollment` | Đăng ký tự do / có mã, onboarding M0, lịch 30 ngày theo ngày đăng ký, hạn nộp, trạng thái (đang học, bảo lưu, tạm dừng, quá hạn…), gia hạn/bảo lưu | identity, org, curriculum | P0 |
| `learning` | Màn buổi học, chọn nguồn, tích hoàn thành kèm minh chứng, phản tư, làm trắc nghiệm module | enrollment | P0 |
| `review` | Báo cáo module (tự gom minh chứng + 5 trường), hàng đợi TA kiểm hồ sơ, mentor chấm Đạt/Cần sửa theo checklist, thư viện nhận xét, phiên bản nộp lại, hạn phản hồi | learning | P0 |
| `school-dashboard` | Tiến độ theo trường/khoa/lớp cho GV, QL trường, Viện; xuất Excel | enrollment, learning, review | P0 |
| `notifications` | Sự kiện (hạn sắp tới, trễ hạn, 7 ngày không hoạt động, bài đã chấm…) → email + webhook n8n; job chạy theo lịch | enrollment, review | P0 |
| `project-certificate` | Dự án cuối, rubric 100 điểm, chấm chéo khi ≥90, duyệt cấp theo lô, PDF + QR, trang `/verify/{mã}` (Trường + Viện hoặc chỉ Viện) | review, org | P1 |
| `course-integration` | API nhận tiến độ/hoàn thành từ suai.vn (Tutor LMS), xác nhận thủ công khóa Zoom, miễn trắc nghiệm, suất miễn phí và voucher; plugin `aict-bridge` | learning, identity | P2 |
| `live-sessions` | Giờ hỗ trợ trên meet.suai.vn: lịch, JWT Jitsi, điểm danh | identity, enrollment | P2 |

Màn quản trị **không** tách thành module riêng: mỗi module tự có phần admin của mình.

## Thứ tự xây dựng

```
identity → org, curriculum → enrollment → learning → review → school-dashboard, notifications
        → (P1) project-certificate → (P2) course-integration, live-sessions
```

Sau khi bản đồ này được duyệt, tôi viết `SPEC-identity.md` trước, sau đó lần lượt các module P0 theo thứ tự trên.

## Câu hỏi còn mở (không chặn việc viết spec)

- Gửi email qua đâu: SMTP của mail server có sẵn, hay dịch vụ như Amazon SES / Resend / Brevo?
- Cấu hình VPS và những gì đang chạy trên đó (xem `docs/PORTAL_PHAC_THAO.md` mục 9.1).
- Ngày workshop đầu tiên, để chốt hạn P0.
