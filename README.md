# Portal AI Campus Tour

Portal đồng hành 30 ngày cho sinh viên sau workshop **AI Campus Tour** (sáng lập bởi Sự AI): học theo lộ trình 12 buổi, nộp báo cáo, mentor chấm, nhận chứng nhận.

- Thiết kế nghiệp vụ: [`docs/`](docs/README.md)
- Bản đồ module: [`CAPABILITY_MAP.md`](CAPABILITY_MAP.md) · Spec từng module: `SPEC-<module>.md`
- Kế hoạch từng module: `tasks/<module>/plan.md`, `tasks/<module>/todo.md`

## Chạy ở máy local

Yêu cầu: Node.js ≥ 22 (production dùng 24 LTS), pnpm 10.

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

## Kiểm tra trước khi commit

```bash
pnpm lint
pnpm typecheck
pnpm test           # Vitest
pnpm test:e2e       # Playwright (tự build và chạy bản standalone)
pnpm build
```

## Ghi chú kỹ thuật

- Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4.
- Tài liệu Next.js đúng phiên bản đang dùng nằm trong `node_modules/next/dist/docs/` (xem `AGENTS.md`).
- `pnpm start` chạy bản build `standalone`, giống cách chạy trên VPS.
