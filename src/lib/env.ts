import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Môi trường triển khai thật. Chỉ đặt "production" trên VPS chính thức
  // (NODE_ENV=production cũng dùng cho bản build chạy E2E nên không đủ để phân biệt).
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\//, "phải là chuỗi kết nối PostgreSQL (postgres://…)"),
  APP_URL: z.url("phải là URL đầy đủ, vd. https://aicampustour.suai.vn"),
  BETTER_AUTH_SECRET: z.string().min(32, "phải dài ít nhất 32 ký tự (tạo bằng: openssl rand -base64 32)"),
  EMAIL_TRANSPORT: z.enum(["brevo", "file", "memory"]).default("file"),
  EMAIL_FROM: z.email().default("no-reply@suai.vn"),
  EMAIL_FROM_NAME: z.string().default("AI Campus Tour"),
  EMAIL_OUTBOX_DIR: z.string().default(".outbox"),
  BREVO_API_KEY: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.APP_ENV === "production" && value.EMAIL_TRANSPORT !== "brevo") {
    ctx.addIssue({ code: "custom", path: ["EMAIL_TRANSPORT"], message: "production phải dùng brevo" });
  }
  if (value.EMAIL_TRANSPORT === "brevo" && !value.BREVO_API_KEY) {
    ctx.addIssue({ code: "custom", path: ["BREVO_API_KEY"], message: "chưa được đặt (bắt buộc khi dùng brevo)" });
  }
  if (value.EMAIL_TRANSPORT === "memory" && value.NODE_ENV !== "test") {
    ctx.addIssue({ code: "custom", path: ["EMAIL_TRANSPORT"], message: "memory chỉ dùng khi chạy test" });
  }
});

export type Env = z.infer<typeof EnvSchema>;

/** Kiểm tra biến môi trường. Thông báo lỗi chỉ nêu tên biến, không in giá trị (có thể là secret). */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = EnvSchema.safeParse(source);
  if (result.success) return result.data;

  const lines = result.error.issues.map((issue) => {
    const name = issue.path.join(".");
    const reason = issue.code === "invalid_type" ? "chưa được đặt" : issue.message;
    return `- ${name}: ${reason}`;
  });
  throw new Error(`Cấu hình môi trường không hợp lệ:\n${lines.join("\n")}`);
}

let cached: Env | undefined;

export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
