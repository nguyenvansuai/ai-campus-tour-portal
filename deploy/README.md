# Deploy portal AI Campus Tour lên VPS

> Claude không tự deploy. Các bước dưới đây do người quản trị VPS chạy.

## 0. Yêu cầu

- VPS Ubuntu có Docker + Docker Compose v2 (`docker compose version`), tối thiểu 2 vCPU / 4 GB RAM / 40 GB SSD.
- **Không chạy chung VPS với Jitsi (meet.suai.vn).**
- DNS: bản ghi **A** `aicampustour.suai.vn` → IP của VPS (kiểm tra: `dig +short aicampustour.suai.vn`).
- Đã chuẩn bị: Brevo API key, Google OAuth client secret **mới** (secret cũ đã lộ).

## 1. Lấy code và tạo file cấu hình (lần đầu)

```bash
git clone https://github.com/nguyenvansuai/ai-campus-tour-portal.git
cd ai-campus-tour-portal/deploy
cp .env.production.example .env.production
nano .env.production
chmod 600 .env.production
```

Bắt buộc điền:

| Biến | Cách lấy |
|---|---|
| `POSTGRES_PASSWORD` | `openssl rand -hex 24` |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` (đổi giá trị này là mọi người bị đăng xuất và phải kết nối lại Drive) |
| `BREVO_API_KEY` | Brevo → SMTP & API → API Keys |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials → OAuth client (tạo secret mới) |

Tùy chọn: `SUAI_BRIDGE_SECRET` (cầu nối suai.vn, `openssl rand -hex 32`), `JITSI_APP_ID`/`JITSI_APP_SECRET` (khi meet.suai.vn bật JWT), `NOTIFY_WEBHOOK_URL`/`SECRET` (n8n gửi Zalo). Để trống là tắt.

Secret chỉ nằm trong file này trên VPS. Không commit, không gửi qua chat.

## 2. Build và chạy

```bash
./deploy.sh --caddy   # VPS CHƯA có web server nào dùng cổng 80/443: Caddy tự cấp HTTPS
# hoặc
./deploy.sh           # VPS ĐÃ có Nginx/Caddy (vd. đang chạy WordPress, n8n)
```

Script làm: `git pull` → build image → bật database → chạy migration → bật `app` (cổng `127.0.0.1:3000`) và `worker` (nhắc hạn, cập nhật trạng thái mỗi 15 phút).

Nếu cổng 3000 đã có app khác dùng (`ss -ltnp | grep :3000`), đặt `APP_PORT` (vd. `3010`) trong `.env.production` và dùng cổng đó trong cấu hình Nginx.

Nếu dùng web server sẵn có, thêm cấu hình trỏ `aicampustour.suai.vn` về `http://127.0.0.1:3000`. Ví dụ Nginx:

```nginx
server {
    server_name aicampustour.suai.vn;
    client_max_body_size 12m;   # minh chứng tối đa 10 MB
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Sau đó `sudo certbot --nginx -d aicampustour.suai.vn` để có HTTPS.

## 3. Tạo Super Admin (lần đầu)

```bash
docker compose --env-file .env.production --profile tools run --rm tools pnpm admin:create nguyenvansutt@gmail.com
```

## 4. Cấu hình sau khi chạy (lần đầu)

1. **Google OAuth** (Google Cloud Console → Credentials → OAuth client) thêm 2 Authorized redirect URI:
   - `https://aicampustour.suai.vn/api/auth/callback/google`
   - `https://aicampustour.suai.vn/api/admin/drive/callback`
   Bật **Google Drive API** cho project. Chuyển OAuth consent screen sang **In production**.
2. Mở `https://aicampustour.suai.vn` → đăng nhập `nguyenvansutt@gmail.com` (mã OTP qua email).
3. `/admin/luu-tru` → **Kết nối Google Drive** bằng Gmail 200 GB. Chưa kết nối thì SV không nộp được file.
4. `/admin/truong`: tạo trường (đánh dấu **Đã kết nối** với trường cấp chứng nhận chung), `/admin/su-kien`: tạo sự kiện workshop + mã kích hoạt.
5. `/admin/nguoi-dung/moi`: mời Admin, Mentor, TA, Viện ĐT Bách Khoa, Quản lý trường, Giáo viên.
6. (Tùy chọn) Cài plugin `integrations/wordpress/aict-bridge` lên suai.vn, xem README trong thư mục đó.

## 5. Cập nhật phiên bản mới

```bash
cd ai-campus-tour-portal/deploy
./deploy.sh --caddy   # hoặc ./deploy.sh, giống lần đầu
```

## 6. Theo dõi và xử lý sự cố

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f --tail=100 app
docker compose --env-file .env.production logs --tail=50 worker
```

- App không lên, log ghi `Cấu hình môi trường không hợp lệ` → sửa đúng biến được nêu trong `.env.production` rồi chạy lại `./deploy.sh`.
- Không nhận được email OTP → kiểm tra `BREVO_API_KEY`, domain `suai.vn` đã xác thực trên Brevo.

## 7. Sao lưu

- `deploy/backup.sh` dump database và giữ 14 bản gần nhất. Đặt cron chạy hằng ngày (hướng dẫn trong file).
- **Bắt buộc đẩy bản sao lưu ra ngoài VPS** (vd. `rclone` sang Google Drive).
- Khôi phục: `gunzip -c portal-YYYYMMDD.sql.gz | docker compose --env-file .env.production exec -T db psql -U portal portal`

## 8. Việc cần làm trước khi mở cho SV

- [ ] Brevo: xác thực domain `suai.vn` (SPF, DKIM, DMARC); gửi thử OTP tới Gmail và Outlook, kiểm tra không vào spam.
- [ ] Tạo Google client secret mới, vô hiệu hóa secret cũ đã lộ.
- [ ] Hạn mức gửi email của gói Brevo đủ cho đỉnh ~500 email OTP trong 5 phút.
- [ ] Kết nối Google Drive, nộp thử 1 minh chứng có ảnh.
- [ ] Bật sao lưu hằng ngày ra ngoài VPS.
