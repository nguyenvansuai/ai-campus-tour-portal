# Todo: module `identity`

> Theo `tasks/plan.md`. Mỗi task: viết test trước → code → `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → commit riêng.

## Phase 1: Nền móng

## Task 1: Khởi tạo dự án Next.js + công cụ chất lượng + CI

**Description:** Tạo ứng dụng Next.js (App Router, TypeScript strict) với Tailwind + shadcn/ui, ESLint, Vitest, Playwright, pnpm. Trang chủ tạm "AI Campus Tour – Sáng lập bởi Sự AI". GitHub Actions chạy lint, typecheck, test, build.

**Acceptance criteria:**
- [x] `pnpm dev` mở được trang chủ tiếng Việt, hiển thị đúng trên khung 375px
- [x] Các lệnh `lint`, `typecheck`, `test`, `test:e2e`, `build` có trong `package.json` và chạy sạch
- [x] Workflow CI chạy khi push lên `main`

**Verification:**
- [x] `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- [x] 1 test Vitest mẫu + 1 test Playwright mở trang chủ

**Dependencies:** Không

**Files likely touched:** `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/(public)/page.tsx`, `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`

**Estimated scope:** Medium

## Task 2: Postgres dev, Drizzle, cấu hình môi trường, khung test DB

**Description:** `deploy/docker-compose.dev.yml` chạy Postgres 16. Cấu hình Drizzle + drizzle-kit, `src/lib/env.ts` kiểm tra biến môi trường bằng Zod, `src/lib/db.ts`. Khung test: tạo DB test, chạy migration, dọn dữ liệu giữa các test. CI có service Postgres.

**Acceptance criteria:**
- [x] `pnpm db:generate` / `pnpm db:migrate` chạy được
- [x] Thiếu biến môi trường bắt buộc thì app báo lỗi rõ ràng khi khởi động
- [x] Test integration mẫu ghi/đọc Postgres thật, chạy được cả local và CI

**Verification:**
- [x] `pnpm test` (gồm test integration)
- [x] CI xanh

**Dependencies:** Task 1

**Files likely touched:** `deploy/docker-compose.dev.yml`, `drizzle.config.ts`, `src/lib/env.ts`, `src/lib/db.ts`, `tests/setup/db.ts`, `.env.example`

**Estimated scope:** Medium

### Checkpoint 1
- [ ] Mọi lệnh kiểm tra sạch, CI xanh

## Phase 2: Đăng nhập

## Task 3: Better Auth + bảng tài khoản + email OTP (phía server)

**Description:** Cấu hình Better Auth với plugin email OTP; bảng `user`, `session`, `account`, `verification` qua Drizzle. `EmailTransport` có 2 bản: Brevo (production, gửi từ `no-reply@suai.vn`) và transport giả cho test. Mẫu email OTP tiếng Việt.

**Acceptance criteria:**
- [x] Xin mã → email (giả) chứa mã 6 số; nhập đúng mã → tạo phiên; mã hết hạn sau 10 phút
- [x] Email được chuẩn hóa chữ thường; không log mã OTP
- [x] Tài khoản `suspended` không đăng nhập được

**Verification:**
- [x] Integration test cho xin mã, đăng nhập, hết hạn, tài khoản bị khóa

**Dependencies:** Task 2

**Files likely touched:** `src/modules/identity/schema.ts`, `src/modules/identity/auth.ts`, `src/lib/email.ts`, `src/app/api/auth/[...all]/route.ts`, `tests/identity/otp.test.ts`

**Estimated scope:** Medium

## Task 4: Màn đăng nhập OTP trên điện thoại + phiên SV 30 ngày

**Description:** Trang `/dang-nhap`: bước 1 nhập email, bước 2 nhập mã (ô nhập 6 số, tự điền mã từ bàn phím điện thoại, nút gửi lại có đếm ngược). Phiên SV 30 ngày. Trang tạm sau đăng nhập hiện "Xin chào, <tên>" và nút đăng xuất.

**Acceptance criteria:**
- [x] Luồng đăng nhập ≤ 3 màn hình trên khung 375px
- [x] Thông báo lỗi tiếng Việt rõ ràng (sai mã, hết hạn, gửi quá nhiều)
- [x] Phiên SV hết hạn sau 30 ngày (kiểm tra cấu hình bằng test)

**Verification:**
- [x] E2E Playwright: đăng nhập OTP trên khung điện thoại, lấy mã từ transport giả
- [x] Kiểm tra tay trên `pnpm dev`

**Dependencies:** Task 3

**Files likely touched:** `src/app/(auth)/dang-nhap/page.tsx`, `src/modules/identity/ui/otp-form.tsx`, `src/app/(student)/page.tsx`, `e2e/identity.spec.ts`

**Estimated scope:** Medium

## Task 5: Đăng nhập Google + gộp tài khoản cùng email

**Description:** Thêm nhà cung cấp Google vào Better Auth. Cùng email thì gắn vào tài khoản sẵn có, không tạo tài khoản mới. Nút "Tiếp tục với Google" trên `/dang-nhap`.

**Acceptance criteria:**
- [x] Tài khoản đã tạo bằng OTP, đăng nhập Google cùng email → vẫn là 1 `user`, thêm 1 dòng `account`
- [x] Thiếu cấu hình Google thì ẩn nút, app vẫn chạy

**Verification:**
- [x] Integration test gộp tài khoản (giả lập callback Google)
- [ ] Kiểm tra tay với OAuth client thật khi Johnny cấp

**Dependencies:** Task 4

**Files likely touched:** `src/modules/identity/auth.ts`, `src/modules/identity/ui/google-button.tsx`, `tests/identity/google-link.test.ts`

**Estimated scope:** Small

## Task 6: Giới hạn xin mã/nhập sai OTP

**Description:** Bảng đếm rate limit trong Postgres. Mỗi email: 5 lần xin mã/15 phút, 5 lần nhập sai/mã. Theo IP: ≥ 600 lần/15 phút.

**Acceptance criteria:**
- [x] Vượt giới hạn theo email → lỗi "thử lại sau X phút"
- [x] 500 email khác nhau xin mã từ cùng 1 IP trong 5 phút → không bị chặn
- [x] Nhập sai 5 lần → mã bị hủy, phải xin mã mới

**Verification:**
- [x] Integration test cho từng giới hạn + test tải 500 yêu cầu cùng IP

**Dependencies:** Task 3

**Files likely touched:** `src/lib/rate-limit.ts`, `src/modules/identity/schema.ts`, `src/modules/identity/auth.ts`, `tests/identity/rate-limit.test.ts`

**Estimated scope:** Small

### Checkpoint 2
- [ ] Đăng nhập OTP + Google chạy; test giới hạn pass
- [ ] Johnny xem thử luồng đăng nhập

## Phase 3: Vai trò và quản trị

## Task 7: `role_assignment` + `policy.ts` + bảng ma trận quyền

**Description:** Bảng `role_assignment` (role, scope_type, scope_id, revoked_at). `can()`, `authorize()`, `scopeFilter()` là hàm thuần. Bảng test ma trận quyền ≥ 40 ca.

**Acceptance criteria:**
- [ ] Đủ 8 vai trò theo spec; một người nhiều vai trò
- [ ] Các ca khác trường / khác khoa / khác lớp / vai trò đã thu hồi / tài khoản bị khóa đều bị từ chối
- [ ] 100% dòng của `policy.ts` được test

**Verification:**
- [ ] `pnpm test -- policy` với báo cáo coverage

**Dependencies:** Task 2

**Files likely touched:** `src/modules/identity/schema.ts`, `src/modules/identity/policy.ts`, `tests/identity/policy.matrix.test.ts`

**Estimated scope:** Medium

## Task 8: `requireActor()`, audit log, lệnh `admin:create`

**Description:** `requireActor()` lấy phiên + vai trò còn hiệu lực. `src/lib/audit.ts` ghi `audit_log`. Script `pnpm admin:create <email>` tạo/gán `super_admin` (dùng cho `nguyenvansutt@gmail.com`). Khuôn chung cho server action (actor → Zod → authorize → service → audit).

**Acceptance criteria:**
- [ ] Chạy `admin:create` 2 lần không tạo trùng; có ghi audit
- [ ] Request không có phiên → chuyển về `/dang-nhap`; có phiên nhưng thiếu quyền → trang 403 tiếng Việt

**Verification:**
- [ ] Integration test cho `requireActor`, `audit`, script

**Dependencies:** Task 3, Task 7

**Files likely touched:** `src/modules/identity/actor.ts`, `src/lib/audit.ts`, `scripts/admin-create.ts`, `src/app/forbidden.tsx`, `tests/identity/actor.test.ts`

**Estimated scope:** Medium

## Task 9: Mời nhân sự

**Description:** Bảng `staff_invitation`. Admin tạo lời mời tại `/admin/nguoi-dung/moi` (email, vai trò, phạm vi). Gửi email mời. Người được mời đăng nhập bằng đúng email → vai trò được kích hoạt. Hạn 14 ngày. Ô chọn phạm vi trường/khoa/lớp tạm nhập ID; module `org` sẽ thay bằng ô chọn.

**Acceptance criteria:**
- [ ] Chỉ `super_admin`/`admin` mời được; admin không mời được `super_admin`
- [ ] Đăng nhập lần đầu bằng email được mời → có đúng vai trò và phạm vi
- [ ] Lời mời quá 14 ngày không kích hoạt

**Verification:**
- [ ] Integration test + E2E: admin mời → người được mời đăng nhập → thấy menu đúng vai trò

**Dependencies:** Task 8

**Files likely touched:** `src/modules/identity/schema.ts`, `src/modules/identity/service.ts`, `src/modules/identity/actions.ts`, `src/app/(admin)/admin/nguoi-dung/moi/page.tsx`, `tests/identity/invite.test.ts`

**Estimated scope:** Medium

## Task 10: Danh sách người dùng: vai trò, thu hồi, khóa/mở

**Description:** `/admin/nguoi-dung`: tìm theo email/tên, lọc theo vai trò, xem chi tiết, thu hồi vai trò, khóa/mở tài khoản (khóa thì thu hồi mọi phiên).

**Acceptance criteria:**
- [ ] Khóa tài khoản → request kế tiếp của người đó bị từ chối
- [ ] Thu hồi vai trò có hiệu lực ngay, có ghi audit
- [ ] Phân trang danh sách (dự kiến hàng chục nghìn SV)

**Verification:**
- [ ] Integration test khóa/thu hồi; E2E thao tác admin

**Dependencies:** Task 9

**Files likely touched:** `src/app/(admin)/admin/nguoi-dung/page.tsx`, `src/app/(admin)/admin/nguoi-dung/[id]/page.tsx`, `src/modules/identity/service.ts`, `src/modules/identity/actions.ts`, `tests/identity/admin-users.test.ts`

**Estimated scope:** Medium

## Task 11: Quản lý phiên đăng nhập

**Description:** Phiên nhân sự không tự hết hạn (tự gia hạn khi dùng). Trang `/tai-khoan/thiet-bi`: xem các thiết bị đang đăng nhập và đăng xuất từng thiết bị. Admin thu hồi mọi phiên của một người trong trang chi tiết người dùng.

**Acceptance criteria:**
- [ ] Phiên nhân sự không bị đăng xuất theo thời gian; phiên SV hết sau 30 ngày
- [ ] Đăng xuất 1 thiết bị không ảnh hưởng thiết bị khác
- [ ] Admin thu hồi → mọi thiết bị của người đó bị đăng xuất, có ghi audit

**Verification:**
- [ ] Integration test cho 2 loại phiên và thao tác thu hồi

**Dependencies:** Task 10

**Files likely touched:** `src/modules/identity/auth.ts`, `src/app/(account)/tai-khoan/thiet-bi/page.tsx`, `src/modules/identity/service.ts`, `tests/identity/sessions.test.ts`

**Estimated scope:** Small

## Task 12: Màn xem nhật ký

**Description:** `/admin/nhat-ky`: danh sách audit log, lọc theo người thực hiện, hành động, khoảng thời gian; phân trang. Chỉ `super_admin` và `admin` xem được.

**Acceptance criteria:**
- [ ] Mọi thao tác trong danh sách audit của spec hiện trên màn này
- [ ] Vai trò khác truy cập → 403

**Verification:**
- [ ] Integration test quyền + E2E lọc nhật ký

**Dependencies:** Task 8

**Files likely touched:** `src/app/(admin)/admin/nhat-ky/page.tsx`, `src/lib/audit.ts`, `tests/identity/audit-view.test.ts`

**Estimated scope:** Small

## Task 13: Bảng `consent` + service đồng ý điều khoản

**Description:** Bảng `consent` (consent_key, terms_version, granted_at, withdrawn_at). Service ghi nhận / rút đồng ý; hàm kiểm tra người dùng đã đồng ý đủ các ô bắt buộc của phiên bản hiện hành chưa. Giao diện tick ô thuộc module `enrollment` (onboarding).

**Acceptance criteria:**
- [ ] Đổi phiên bản điều khoản → `hasRequiredConsents()` trả về false cho đến khi đồng ý lại
- [ ] Rút đồng ý chỉ áp dụng cho ô không bắt buộc; mọi thao tác có audit

**Verification:**
- [ ] Integration test

**Dependencies:** Task 8

**Files likely touched:** `src/modules/identity/schema.ts`, `src/modules/identity/consent.ts`, `tests/identity/consent.test.ts`

**Estimated scope:** Small

### Checkpoint 3
- [ ] Đủ 9 Success Criteria trong `SPEC-identity.md`
- [ ] Review code 5 trục

## Phase 4: Chuẩn bị deploy

## Task 14: Dockerfile, docker-compose, Caddyfile, hướng dẫn VPS

**Description:** Dockerfile build Next.js standalone; `deploy/docker-compose.yml` (app + Postgres + Caddy); Caddyfile cho `aicampustour.suai.vn`; `deploy/README.md` hướng dẫn trỏ DNS, đặt biến môi trường, chạy migration, tạo Super Admin. **Không tự deploy**: Johnny chạy trên VPS.

**Acceptance criteria:**
- [ ] `docker compose up` local chạy được app + DB
- [ ] Không có secret nào trong file commit

**Verification:**
- [ ] Build image và chạy thử local

**Dependencies:** Checkpoint 3

**Files likely touched:** `Dockerfile`, `.dockerignore`, `deploy/docker-compose.yml`, `deploy/Caddyfile`, `deploy/README.md`

**Estimated scope:** Medium
