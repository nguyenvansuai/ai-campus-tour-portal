# Spec: `org` (trường, khoa, lớp, sự kiện workshop, mã kích hoạt)

> Module P0 thứ 2 trong `CAPABILITY_MAP.md`. Phụ thuộc `identity`.
> Trạng thái: **đã duyệt theo ủy quyền** (Johnny cho phép tự làm hết các phase không cần hỏi, 26/10/2026).

## Objective

Quản lý cấu trúc tổ chức để: (1) SV chọn đúng trường/khoa/lớp khi đăng ký, (2) phân quyền giáo viên/quản lý trường theo phạm vi, (3) ghi nguồn đăng ký theo từng workshop, (4) phân biệt trường **đã kết nối** (chứng nhận có tên trường) với trường chưa kết nối.

**User stories**
1. Admin tạo trường (tên, tên viết tắt, cờ đã kết nối), khoa, lớp.
2. Admin tạo sự kiện workshop tại một trường và sinh mã kích hoạt (mã ngắn dễ đọc + đường link/QR), có hạn dùng và giới hạn lượt.
3. SV đăng ký tự do: chọn trường trong danh sách, hoặc nhập tên trường chưa có → tạo trường **chờ xác minh** (chưa kết nối). Khoa/lớp chọn hoặc nhập mới.
4. Admin gộp trường trùng tên do SV tự nhập, và xác minh trường.
5. Khi mời GV/QL trường, admin **chọn** trường/khoa/lớp từ danh sách thay vì nhập mã.

## Thiết kế

| Bảng | Cột chính |
|---|---|
| `school` | id, name, short_name?, connected (bool), status (`verified`/`pending`), created_by?, created_at |
| `faculty` | id, school_id, name (unique theo trường, không phân biệt hoa thường) |
| `class` | id, faculty_id, name (unique theo khoa) |
| `event` | id, school_id, name, held_on (date), created_by |
| `activation_code` | id, event_id, code (unique, 8 ký tự không nhầm lẫn: bỏ 0/O/1/I), max_uses, used_count, expires_at |

- `useActivationCode(code)`: kiểm tra còn hạn, còn lượt; tăng `used_count` nguyên tử; trả về event + school.
- Quyền: `org.manage` (Super Admin, Admin). Xem danh sách trường: mọi người đã đăng nhập (để chọn khi đăng ký).
- Màn admin: `/admin/truong` (danh sách, tạo, sửa, cờ kết nối, xác minh, gộp), `/admin/truong/[id]` (khoa, lớp), `/admin/su-kien` (sự kiện, sinh mã, xem lượt dùng).
- Mã kích hoạt dùng ở đường link `/bat-dau?ma=XXXXXXXX` (QR do admin tự tạo từ link này; portal hiện link để copy).

## Ngoài phạm vi
- Import danh sách SV từ file của trường (để sau).
- In QR ngay trong portal (dùng công cụ QR ngoài từ link).

## Testing
- Unit: sinh mã không có ký tự dễ nhầm; chuẩn hóa tên.
- Integration: dùng mã (hết hạn, hết lượt, 2 request đồng thời không vượt `max_uses`); tạo trường chờ xác minh; gộp trường chuyển khoa/lớp/hồ sơ SV sang trường giữ lại; quyền `org.manage`.
- E2E: admin tạo trường + sự kiện + mã.

## Boundaries
Theo `SPEC-identity.md`.

## Success Criteria
1. Admin tạo được trường/khoa/lớp/sự kiện/mã; người không phải admin bị 403.
2. Mã hết hạn hoặc hết lượt bị từ chối với thông báo tiếng Việt; 2 request cùng lúc với mã còn 1 lượt chỉ 1 request thành công.
3. SV tạo được trường mới ở trạng thái chờ xác minh; admin gộp và xác minh được.
4. Mời GV dùng ô chọn trường/khoa/lớp.
