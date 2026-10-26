# Deploy portal AI Campus Tour lên VPS

> Claude không tự deploy. Các bước dưới đây do Johnny (hoặc người quản trị VPS) chạy.

## 0. Yêu cầu

- VPS có Docker + Docker Compose v2, tối thiểu 2 vCPU / 4 GB RAM / 40 GB SSD.
- **Không chạy chung VPS với Jitsi (meet.suai.vn).**
- Bản ghi DNS: `aicampustour.suai.vn` → **A** về IP của VPS.

## 1. Lấy code và tạo file cấu hình

```bash
git clone https://github.com/nguyenvansuai/ai-campus-tour-portal.git
cd ai-campus-tour-portal/deploy
cp .env.production.example .env.production
nano .env.production   # điền POSTGRES_PASSWORD, BETTER_AUTH_SECRET, BREVO_API_KEY, GOOGLE_CLIENT_SECRET
chmod 600 .env.production
```

- `BETTER_AUTH_SECRET`: tạo bằng `openssl rand -base64 32`.
- Secret chỉ nằm trong file này trên VPS. Không commit, không gửi qua chat.

## 2. Khởi động database và chạy migration

```bash
docker compose --env-file .env.production up -d db
docker compose --env-file .env.production --profile tools run --rm tools pnpm db:migrate
```

## 3. Tạo Super Admin

```bash
docker compose --env-file .env.production --profile tools run --rm tools pnpm admin:create nguyenvansutt@gmail.com
```

## 4. Chạy portal

**Trường hợp A: VPS chưa có web server nào chiếm cổng 80/443** → dùng Caddy kèm theo (tự cấp HTTPS):

```bash
docker compose --env-file .env.production --profile caddy up -d --build
```

**Trường hợp B: VPS đã có Nginx/Caddy/Traefik** (vd. đang chạy WordPress, n8n) → chỉ chạy app, rồi cấu hình reverse proxy sẵn có trỏ `aicampustour.suai.vn` về `http://127.0.0.1:3000`, nhớ chuyển tiếp header `X-Forwarded-For`:

```bash
docker compose --env-file .env.production up -d --build app
```

Kiểm tra: mở `https://aicampustour.suai.vn`, đăng nhập bằng `nguyenvansutt@gmail.com`, vào `/admin`.

## 5. Cập nhật phiên bản mới

```bash
git pull
docker compose --env-file .env.production --profile tools run --rm --build tools pnpm db:migrate
docker compose --env-file .env.production up -d --build app
```

## 6. Sao lưu

- `deploy/backup.sh` dump database và giữ 14 bản gần nhất. Đặt cron chạy hằng ngày (hướng dẫn trong file).
- **Bắt buộc đẩy bản sao lưu ra ngoài VPS** (vd. `rclone` sang Google Drive), để VPS hỏng không mất dữ liệu SV.
- Khôi phục: `gunzip -c portal-YYYYMMDD.sql.gz | docker compose --env-file .env.production exec -T db psql -U portal portal`

## 7. Việc cần làm trước khi mở cho SV

- [ ] Brevo: xác thực domain `suai.vn` (SPF, DKIM, DMARC); gửi thử email OTP tới Gmail và Outlook, kiểm tra không vào spam.
- [ ] Google OAuth: thêm redirect URI `https://aicampustour.suai.vn/api/auth/callback/google`; chuyển OAuth app sang **In production**.
- [ ] Tạo secret Google mới (secret cũ đã lộ trong chat) và vô hiệu hóa secret cũ.
- [ ] Kiểm tra hạn mức gửi email của gói Brevo với đỉnh ~500 email OTP trong 5 phút.
- [ ] Bật sao lưu hằng ngày ra ngoài VPS.
