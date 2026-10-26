#!/usr/bin/env sh
# Cài lần đầu và cập nhật portal trên VPS. Chạy trong thư mục deploy/:
#   ./deploy.sh            # VPS đã có Nginx/Caddy khác chiếm cổng 80/443 (trỏ về 127.0.0.1:3000)
#   ./deploy.sh --caddy    # dùng Caddy kèm theo, tự cấp HTTPS
set -eu
cd "$(dirname "$0")"

if [ ! -f .env.production ]; then
  echo "Chưa có deploy/.env.production. Chạy: cp .env.production.example .env.production rồi điền giá trị." >&2
  exit 1
fi

COMPOSE="docker compose --env-file .env.production"
PROFILE=""
[ "${1:-}" = "--caddy" ] && PROFILE="--profile caddy"

echo "==> Lấy code mới"
git -C .. pull --ff-only

echo "==> Build image"
$COMPOSE --profile tools build app worker tools

echo "==> Khởi động database"
$COMPOSE up -d db

echo "==> Chạy migration"
$COMPOSE --profile tools run --rm tools pnpm db:migrate

echo "==> Khởi động portal và worker"
$COMPOSE $PROFILE up -d app worker $( [ -n "$PROFILE" ] && echo caddy )

echo "==> Trạng thái"
$COMPOSE $PROFILE ps
PORT=$(grep -E "^APP_PORT=" .env.production | cut -d= -f2)
echo "Xong. Kiểm tra: curl -sI http://127.0.0.1:${PORT:-3000} | head -1"
