@AGENTS.md

# Quy ước dự án Portal AI Campus Tour

- Làm theo quy trình agent-skills: `CAPABILITY_MAP.md` → `SPEC-<module>.md` → `tasks/plan.md` + `tasks/todo.md` → build từng task (test trước, commit riêng mỗi task).
- Trước khi commit: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (thêm `pnpm test:e2e` khi đổi giao diện/luồng).
- Mỗi module nằm trong `src/modules/<module-id>/`. Server action theo thứ tự: lấy actor → Zod → `authorize` → service → audit.
- Chuỗi giao diện tiếng Việt; tên biến/hàm tiếng Anh; URL tiếng Việt không dấu.
- Không commit secret; không log OTP/token; không tắt kiểm tra quyền; không tự deploy.
- Hỏi trước khi: thêm thư viện ngoài Tech Stack của spec, đổi schema đã lên production, deploy.
