import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\//, "phải là chuỗi kết nối PostgreSQL (postgres://…)"),
  APP_URL: z.url("phải là URL đầy đủ, vd. https://aicampustour.suai.vn"),
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
