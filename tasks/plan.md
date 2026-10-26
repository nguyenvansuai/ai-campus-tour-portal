# Implementation Plan: module `identity`

> Theo `SPEC-identity.md` (đã duyệt). Danh sách task chi tiết ở `tasks/todo.md`.
> Trạng thái: **chờ duyệt kế hoạch**.

## Overview

Repo hiện chỉ có tài liệu, nên phải khởi tạo dự án trước (Phase 1). Sau đó làm theo từng lát dọc, mỗi lát chạy được và test được: đăng nhập OTP → Google → giới hạn → vai trò và kiểm tra quyền → mời nhân sự → quản trị người dùng → nhật ký → đồng ý điều khoản.

## Architecture Decisions

- **Một ứng dụng Next.js 16**, mỗi module nằm trong `src/modules/<id>/`. **Tắt Cache Components** (mặc định của template): gần như mọi trang đều cần phiên đăng nhập, bật lên chỉ thêm phức tạp mà không có lợi.
- **shadcn/ui:** registry `ui.shadcn.com` bị chặn trong môi trường cloud của Claude, nên component được viết tay theo đúng khuôn shadcn (`components.json` đã có để chạy `shadcn add` ở máy local khi cần).
- **Better Auth** quản lý OTP, Google, phiên đăng nhập; vai trò và phạm vi do module tự quản lý trong `role_assignment`, không dùng plugin phân quyền của Better Auth. Lý do: phạm vi trường/khoa/lớp là đặc thù của dự án.
- **`policy.ts` là hàm thuần**, không truy cập DB, để test bảng ma trận quyền nhanh và đầy đủ. Việc lấy vai trò của người dùng nằm ở `requireActor()`.
- **Gửi email qua một interface `EmailTransport`**: production dùng Brevo, test dùng transport giả lưu thư vào bộ nhớ.
- **Rate limit lưu trong Postgres** (bảng đếm theo khung thời gian), chưa cần Redis ở quy mô hiện tại.
- **Integration test chạy trên Postgres thật** (Docker), mỗi test file dùng một schema/DB sạch.

## Task List

### Phase 1: Nền móng
- [x] Task 1: Khởi tạo dự án Next.js + công cụ chất lượng + CI
- [x] Task 2: Postgres dev, Drizzle, cấu hình môi trường, khung test DB

### Checkpoint 1
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` sạch; CI xanh trên GitHub

### Phase 2: Đăng nhập
- [ ] Task 3: Better Auth + bảng tài khoản + email OTP (phía server)
- [ ] Task 4: Màn đăng nhập OTP trên điện thoại + phiên SV 30 ngày
- [ ] Task 5: Đăng nhập Google + gộp tài khoản cùng email
- [ ] Task 6: Giới hạn xin mã/nhập sai OTP (theo email, theo IP mức cao)

### Checkpoint 2
- [ ] SV đăng nhập được bằng OTP và Google (Google kiểm tra tay với client thật nếu đã có)
- [ ] Test "500 lần đăng nhập cùng IP trong 5 phút" pass
- [ ] **Johnny xem thử luồng đăng nhập trước khi đi tiếp**

### Phase 3: Vai trò và quản trị
- [ ] Task 7: `role_assignment` + `policy.ts` + bảng ma trận quyền ≥ 40 ca
- [ ] Task 8: `requireActor()`, thư viện audit log, lệnh `admin:create`
- [ ] Task 9: Mời nhân sự (service + màn admin + kích hoạt khi đăng nhập)
- [ ] Task 10: Danh sách người dùng: xem vai trò, thu hồi vai trò, khóa/mở tài khoản
- [ ] Task 11: Quản lý phiên đăng nhập (nhân sự tự đăng xuất thiết bị; admin thu hồi mọi phiên)
- [ ] Task 12: Màn xem nhật ký `/admin/nhat-ky`
- [ ] Task 13: Bảng `consent` + service ghi nhận/rút đồng ý theo phiên bản điều khoản

### Checkpoint 3 (hoàn tất module)
- [ ] Đạt đủ 9 Success Criteria trong `SPEC-identity.md`
- [ ] Review code (5 trục: đúng, dễ đọc, kiến trúc, bảo mật, hiệu năng)

### Phase 4: Chuẩn bị deploy (không tự deploy)
- [ ] Task 14: Dockerfile (standalone), `deploy/docker-compose.yml`, Caddyfile, hướng dẫn chạy trên VPS

## Risks and Mitigations

| Rủi ro | Mức | Cách giảm |
|---|---|---|
| API của Better Auth đổi giữa các phiên bản | Trung bình | Chốt phiên bản trong lockfile; bọc cấu hình trong `auth.ts` |
| Email OTP vào spam hoặc chậm lúc 500 SV cùng đăng nhập | **Cao** | Xác thực domain trên Brevo trước workshop; kiểm tra hạn mức gói Brevo; giữ đăng nhập Google làm đường dự phòng |
| Giới hạn theo IP chặn nhầm SV dùng chung wifi | Cao | Ngưỡng IP cao + test tải riêng (Task 6) |
| Phiên nhân sự không hết hạn: mất điện thoại là lộ dữ liệu | Trung bình | Trang quản lý phiên, admin thu hồi được (Task 11); khuyến nghị nhân sự khóa màn hình điện thoại |
| Kiểm tra quyền bị bỏ sót ở một server action | **Cao** | Mọi action đi qua một khuôn chung; test ma trận quyền; mục kiểm tra riêng khi review |
| Google OAuth chưa có client lúc làm Task 5 | Thấp | Code + test bằng mock; kiểm tra thật khi Johnny cấp client |

## Open Questions

- Không có. Việc chuẩn bị bên Johnny (không chặn code): tạo Google Cloud project + OAuth client; tạo tài khoản Brevo và xác thực `suai.vn`.
