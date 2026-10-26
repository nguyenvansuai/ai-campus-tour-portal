#!/usr/bin/env sh
# Chạy bản build standalone giống trên VPS: chép tài nguyên tĩnh vào thư mục standalone rồi chạy server.
set -e
cp -r public .next/standalone/ 2>/dev/null || true
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/
exec node .next/standalone/server.js
