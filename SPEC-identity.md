# Spec: `identity` (tài khoản, đăng nhập, vai trò, phân quyền)

> Module đầu tiên trong `CAPABILITY_MAP.md` (giai đoạn P0). Các module sau đều dựa vào module này.
> Trạng thái: **đã duyệt (26/10/2026)**. Các câu hỏi mở đã được Johnny trả lời.

## Objective

Cho mọi người dùng portal **đăng nhập nhanh trên điện thoại**, không cần mật khẩu, và bảo đảm **mỗi người chỉ thấy đúng dữ liệu trong phạm vi của mình**.

**Người dùng và nhu cầu:**

| Người dùng | Nhu cầu với module này |
|---|---|
| Sinh viên | Tạo tài khoản và đăng nhập trong < 1 phút tại workshop, bằng email OTP hoặc Google |
| Mentor, TA | Được admin mời qua email, đăng nhập và chỉ thấy SV được phân công |
| GV / Quản lý trường | Được mời, chỉ thấy dữ liệu trường/khoa/lớp được gán |
| Viện ĐT Bách Khoa | Xem toàn bộ các trường (chỉ đọc) |
| Admin / Super Admin | Mời nhân sự, gán/thu hồi vai trò, khóa tài khoản, xem nhật ký |

**User stories:**

1. Là SV, tôi nhập email → nhận mã 6 số qua email → nhập mã → vào portal. Hoặc bấm "Tiếp tục với Google".
2. Là SV, tôi đăng nhập lại trên cùng điện thoại mà không phải nhập mã trong 30 ngày. Là nhân sự, tôi không bị tự đăng xuất.
3. Là Admin, tôi mời `thaycuong@...` làm **Quản lý trường** của *ĐH Công Thương*. Người đó đăng nhập lần đầu bằng email được mời thì tự có vai trò đó.
4. Là Admin, tôi gán cho một người cả vai trò Mentor và TA.
5. Là GV được gán *Khoa Kế toán – ĐH Công Thương*, tôi **không** xem được SV khoa khác, trường khác, kể cả khi tự sửa URL.
6. Là Super Admin, tôi khóa một tài khoản; mọi phiên đăng nhập của tài khoản đó hết hiệu lực ngay.
7. Là SV, khi đăng ký tôi tick các ô đồng ý dữ liệu; portal lưu lại tôi đã đồng ý phiên bản điều khoản nào, lúc nào.

**Không thuộc module này:** luồng đăng ký kèm chọn trường/khoa/lớp và mã kích hoạt (module `enrollment`), dữ liệu trường/khoa/lớp (module `org`), trang "Dữ liệu của tôi" có xuất/xóa dữ liệu (P1).

## Thiết kế chính

### Vai trò và phạm vi

| Vai trò (`role`) | Phạm vi (`scope`) | Ghi chú |
|---|---|---|
| `super_admin` | toàn hệ thống | Quản lý admin, cấu hình hệ thống |
| `admin` | toàn hệ thống | Vận hành: trường, nội dung, nhân sự |
| `institute_viewer` | toàn hệ thống, chỉ đọc | Viện ĐT Bách Khoa |
| `mentor` | toàn hệ thống; **thấy bài nộp của SV được phân công** | Phân công nằm ở module `review` |
| `ta` | như mentor | |
| `school_manager` | `school:<id>` | Một người có thể quản lý nhiều trường |
| `teacher` | `school:<id>` / `faculty:<id>` / `class:<id>` | |
| `student` | dữ liệu của chính mình | Không cần gán: ai có hồ sơ học (`enrollment`) là SV |

- Một người có **nhiều vai trò** (bảng `role_assignment`).
- Phạm vi lưu dạng chung `(scope_type, scope_id)`, **không có khóa ngoại sang bảng của `org`**, để `identity` không phụ thuộc ngược `org`. Khi gán vai trò, `org` kiểm tra `scope_id` có tồn tại không.

### Lớp kiểm tra quyền (policy)

Mọi đọc/ghi dữ liệu đều phải gọi qua `authorize()` ở phía server. Giao diện chỉ ẩn nút, **không** được coi là kiểm tra quyền.

```ts
// src/modules/identity/policy.ts
export type Actor = { userId: string; roles: RoleAssignment[] };
export type ResourceRef = {
  kind: "student_record" | "submission" | "school_report" | "user_admin";
  ownerUserId?: string;
  schoolId?: string; facultyId?: string; classId?: string;
  assignedStaffIds?: string[];
};

export function can(actor: Actor, action: Action, res: ResourceRef): boolean { /* bảng quy tắc */ }

export async function authorize(actor: Actor, action: Action, res: ResourceRef) {
  if (!can(actor, action, res)) throw new ForbiddenError(action, res.kind);
}

// Truy vấn danh sách cũng phải lọc theo phạm vi, không lấy hết rồi lọc ở client:
export function scopeFilter(actor: Actor): ScopeFilter { /* trả về điều kiện WHERE theo trường/khoa/lớp/phân công */ }
```

Các module sau tự đăng ký loại tài nguyên và hành động của mình; quy tắc dùng chung đặt tại một chỗ.

### Đăng nhập

| Hạng mục | Quy định |
|---|---|
| Cách đăng nhập | **Email OTP 6 số** (hiệu lực 10 phút, gửi qua Brevo từ `no-reply@suai.vn`) và **Google** (OAuth client trong Google Cloud project dùng chung với Drive API). Không dùng mật khẩu |
| Gộp tài khoản | Cùng email = cùng tài khoản, dù vào bằng OTP hay Google |
| Phiên | Cookie httpOnly. **SV: 30 ngày. Nhân sự: không tự hết hạn** (tự gia hạn khi còn dùng) [Chốt]. Bù lại: nhân sự xem và đăng xuất từng thiết bị; admin thu hồi được mọi phiên của một người; khóa tài khoản thì thu hồi mọi phiên |
| Giới hạn | Mỗi email: 5 lần xin mã/15 phút, 5 lần nhập sai/mã. **Giới hạn theo IP phải đặt cao** (≥ 600 lần/15 phút), vì 500 SV dùng chung wifi hội trường sẽ có cùng một IP |
| Mời nhân sự | Admin tạo lời mời (email, vai trò, phạm vi, hạn 14 ngày). Người được mời đăng nhập bằng đúng email đó thì vai trò được kích hoạt |
| Super Admin đầu tiên | `nguyenvansutt@gmail.com`, tạo bằng lệnh CLI trên server (`pnpm admin:create <email>`), không có giao diện tự phong |

### Dữ liệu (Drizzle, PostgreSQL)

| Bảng | Cột chính |
|---|---|
| `user` | id, email (unique, chữ thường), name, phone?, image?, status (`active`/`suspended`), created_at |
| `session`, `account`, `verification` | Bảng chuẩn của Better Auth |
| `role_assignment` | id, user_id, role, scope_type (`global`/`school`/`faculty`/`class`), scope_id?, granted_by, created_at, revoked_at? |
| `staff_invitation` | id, email, role, scope_type, scope_id?, invited_by, expires_at, accepted_at? |
| `consent` | id, user_id, consent_key, terms_version, granted_at, withdrawn_at? |
| `audit_log` | id, actor_id, action, target_type, target_id, metadata (jsonb), ip, created_at |

Ghi `audit_log` khi: gán/thu hồi vai trò, mời nhân sự, khóa/mở tài khoản, nhân sự đăng nhập, đồng ý/rút đồng ý.

### Màn hình

- `/dang-nhap`: nhập email hoặc chọn Google → nhập mã OTP.
- `/admin/nguoi-dung`: tìm kiếm, xem vai trò, khóa/mở.
- `/admin/nguoi-dung/moi`: mời nhân sự (email, vai trò, phạm vi).
- `/admin/nhat-ky`: xem audit log, lọc theo người và hành động.

## Tech Stack

| Thành phần | Phiên bản |
|---|---|
| Node.js | 24 LTS |
| Next.js (App Router) + React | Bản ổn định mới nhất khi khởi tạo |
| TypeScript | strict |
| PostgreSQL | 16 (Docker) |
| Drizzle ORM + drizzle-kit | Mới nhất |
| Better Auth | Mới nhất, plugin email OTP + Google |
| Tailwind CSS + shadcn/ui | Mới nhất |
| Zod | Kiểm tra dữ liệu vào |
| Vitest, Playwright | Test |
| pnpm | Trình quản lý gói |

Chốt phiên bản cụ thể trong `package.json` và lockfile khi khởi tạo.

## Commands

```bash
pnpm install
docker compose -f deploy/docker-compose.dev.yml up -d db   # Postgres cho dev/test
pnpm db:generate        # sinh migration từ schema Drizzle
pnpm db:migrate         # chạy migration
pnpm dev                # http://localhost:3000
pnpm lint               # ESLint
pnpm typecheck          # tsc --noEmit
pnpm test               # Vitest (unit + integration, cần Postgres)
pnpm test:e2e           # Playwright
pnpm build              # build production (standalone)
pnpm admin:create <email>   # tạo Super Admin đầu tiên
```

## Project Structure

```
src/
  app/
    (public)/            # trang công khai
    (auth)/dang-nhap/    # đăng nhập
    (admin)/admin/       # quản trị
    api/auth/[...all]/   # route của Better Auth
  modules/
    identity/
      schema.ts          # bảng Drizzle của module
      auth.ts            # cấu hình Better Auth
      policy.ts          # can(), authorize(), scopeFilter()
      service.ts         # mời, gán vai trò, khóa tài khoản, consent
      actions.ts         # server actions (gọi service + authorize)
      ui/                # component riêng của module
  lib/
    db.ts  env.ts  email.ts  rate-limit.ts  audit.ts
tests/
  identity/              # integration test với Postgres thật
e2e/
  identity.spec.ts
deploy/
  docker-compose.dev.yml
scripts/
  admin-create.ts
```

Mỗi module sau đều theo khuôn `src/modules/<module-id>/` như trên.

## Code Style

- TypeScript strict, không dùng `any`. Dữ liệu vào server action phải qua Zod.
- **Server action luôn theo thứ tự:** lấy actor → validate → `authorize` → service → ghi audit (nếu cần).
- Tên biến và hàm viết tiếng Anh; chuỗi giao diện viết tiếng Việt và gom một chỗ để dễ sửa.
- URL tiếng Việt không dấu (`/dang-nhap`, `/admin/nguoi-dung`).

```ts
// src/modules/identity/actions.ts
"use server";
export async function inviteStaff(input: unknown) {
  const actor = await requireActor();
  const data = InviteStaffInput.parse(input);           // Zod
  await authorize(actor, "invite_staff", { kind: "user_admin" });
  const invitation = await identityService.invite(actor, data);
  await audit(actor, "staff.invited", "staff_invitation", invitation.id, { role: data.role });
  return { id: invitation.id };
}
```

## Testing Strategy

| Cấp | Nội dung | Công cụ |
|---|---|---|
| Unit | `can()` theo **bảng ma trận quyền**: mỗi dòng (vai trò, phạm vi, hành động, tài nguyên, kết quả mong đợi) là 1 test case. Bắt buộc có các ca "khác trường", "khác khoa", "đã thu hồi vai trò", "tài khoản bị khóa" | Vitest |
| Integration | Mời → đăng nhập → vai trò được kích hoạt; khóa tài khoản → phiên bị thu hồi; giới hạn OTP; `scopeFilter` trả đúng tập dữ liệu trên Postgres thật | Vitest + Postgres Docker |
| E2E | Đăng nhập OTP trên khung màn hình điện thoại (email bắt bằng mock SMTP); admin mời nhân sự | Playwright |

- Không mock database trong integration test.
- Email trong test đi qua một transport giả (không gọi Brevo thật).
- Mục tiêu: 100% dòng của `policy.ts` được test; toàn module ≥ 80%.

## Boundaries

- **Luôn làm:** gọi `authorize` trong mọi server action/route handler; validate bằng Zod; chạy lint + typecheck + test trước khi commit; ghi audit cho thao tác nhạy cảm.
- **Hỏi trước:** thêm thư viện mới ngoài danh sách Tech Stack; đổi schema đã chạy trên production; đổi thời hạn phiên hoặc giới hạn OTP; mọi thao tác deploy.
- **Không bao giờ:** commit secret (Google client secret, Brevo key, Drive refresh token); log mã OTP hay token; tắt kiểm tra quyền để "test cho nhanh"; xóa test đang fail mà không được đồng ý.

## Success Criteria

1. SV đăng nhập bằng OTP hoặc Google thành công trên màn hình 375px; luồng OTP ≤ 3 màn hình.
2. SV đăng nhập lại trong 30 ngày không cần mã; phiên nhân sự không tự hết hạn và thu hồi được từ trang quản lý phiên.
3. Cùng một email, vào bằng OTP hay Google đều ra **cùng một tài khoản**.
4. Lời mời nhân sự kích hoạt đúng vai trò và phạm vi khi đăng nhập; lời mời hết hạn sau 14 ngày thì không dùng được.
5. Bảng ma trận quyền (≥ 40 ca) pass 100%, gồm các ca vượt phạm vi trường/khoa/lớp.
6. Khóa tài khoản thì request kế tiếp của người đó bị từ chối.
7. 500 lần đăng nhập OTP từ **cùng một IP** trong 5 phút không bị chặn nhầm (test tải đơn giản).
8. Mọi thao tác trong danh sách audit đều có bản ghi `audit_log`.
9. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` đều chạy sạch.

## Quyết định đã chốt (thay cho Open Questions)

1. Google OAuth: dùng chung Google Cloud project với Drive API. Johnny tạo client và đặt secret trên VPS.
2. Email gửi đi: `no-reply@suai.vn`. Johnny có quyền thêm DNS (SPF/DKIM/DMARC) cho `suai.vn`.
3. Super Admin ban đầu: `nguyenvansutt@gmail.com`.
4. Phiên: SV 30 ngày; nhân sự không tự hết hạn.
