#!/usr/bin/env sh
# Sao lưu database hằng ngày. Đặt cron trên VPS, ví dụ 2h sáng:
#   0 2 * * * /đường-dẫn/ai-campus-tour-portal/deploy/backup.sh >> /var/log/aicampustour-backup.log 2>&1
# Sau đó đẩy thư mục BACKUP_DIR ra ngoài VPS (vd. rclone sang Google Drive). Giữ 14 bản gần nhất.
set -eu
cd "$(dirname "$0")"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/aicampustour}"
mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/portal-$(date +%Y%m%d-%H%M%S).sql.gz"
docker compose --env-file .env.production exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$FILE"
ls -1t "$BACKUP_DIR"/portal-*.sql.gz | tail -n +15 | xargs -r rm --
echo "Đã sao lưu: $FILE"
