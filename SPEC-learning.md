# Spec: `learning` (học, nộp minh chứng, trắc nghiệm, báo cáo module)

> Module P0. Phụ thuộc `enrollment`, `curriculum`. Trạng thái: **đã duyệt theo ủy quyền** (26/10/2026).
> Phần SV **nộp** báo cáo module nằm ở đây; phần mentor/TA **chấm** nằm ở module `review`.

## Objective
SV mở điện thoại là biết hôm nay làm gì: ngày N/30, buổi tiếp theo, hạn gần nhất. Học xong buổi nào thì nộp minh chứng buổi đó; hết module thì làm trắc nghiệm và nộp báo cáo.

## Màn hình
| Đường dẫn | Nội dung |
|---|---|
| `/hoc` | Ngày N/30, tiến độ x/12 buổi, việc tiếp theo, hạn nộp gần nhất, danh sách module (buổi: đã xong / đang mở / chưa mở) |
| `/hoc/buoi/[số]` | Nội dung buổi theo khối ngành; nút sao chép prompt; thẻ nguồn học (loại, ngôn ngữ, mức phí, điều kiện, phần cần xem); form minh chứng + 2 câu phản tư bắt buộc + chọn nguồn đã học |
| `/hoc/trac-nghiem/[module]` | Rút ngẫu nhiên câu hỏi, xáo phương án, chấm ngay, hiện giải thích |
| `/hoc/bao-cao/[module]` | Tự gom minh chứng 3 buổi + 5 trường báo cáo; xem trạng thái và nhận xét; nộp lại khi "Cần sửa" |

## Quy tắc
- Module M1 mở ngay. Module sau mở khi **đã nộp** báo cáo module trước (không chờ chấm).
- Nộp báo cáo module khi đã hoàn thành đủ các buổi của module.
- Trắc nghiệm: đạt ≥ 80%; làm lại sau 30 phút; tối đa 3 lần/ngày. Không chặn mở module sau.
- Minh chứng: theo `evidence` của buổi (text, textarea có độ dài tối thiểu, link http(s), số, file ảnh/PDF ≤ 10 MB).
- Hồ sơ `completed`/`failed` chỉ xem, không nộp.
- Mỗi lần nộp buổi/báo cáo cập nhật `lastActivityAt`.

## Lưu file
`StorageProvider`: `local` (dev/test, thư mục `.uploads`) và `drive` (production: Google Drive qua OAuth refresh token, scope `drive.file`, thư mục `AI Campus Tour/<Trường>/<MSSV – Họ tên>/<Module>`). Xem file qua `/api/files/[id]` (kiểm tra quyền `submission.view`). Script `pnpm drive:auth` lấy refresh token.

## Success Criteria
1. SV hoàn thành buổi bằng minh chứng hợp lệ; thiếu trường bắt buộc/link sai/file quá lớn bị từ chối bằng thông báo tiếng Việt.
2. Module sau chỉ mở sau khi nộp báo cáo module trước.
3. Trắc nghiệm chấm đúng, tôn trọng giới hạn lần làm.
4. Báo cáo tự gom minh chứng; nộp lại tạo phiên bản mới.
5. Người không có quyền không xem được file của SV khác.
