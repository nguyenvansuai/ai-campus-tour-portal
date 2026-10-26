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
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  /** Webhook n8n nhận sự kiện thông báo (để gửi Zalo). Không đặt thì chỉ gửi email. */
  NOTIFY_WEBHOOK_URL: z.url().optional(),
  NOTIFY_WEBHOOK_SECRET: z.string().optional(),
  STORAGE_DRIVER: z.enum(["local", "drive"]).default("local"),
  UPLOAD_DIR: z.string().default(".uploads"),
  GOOGLE_DRIVE_ROOT_FOLDER: z.string().default("AI Campus Tour"),
  /** Secret chung với plugin aict-bridge trên suai.vn (ký HMAC). Không đặt thì API nhận hoàn thành khóa bị tắt. */
  SUAI_BRIDGE_SECRET: z.string().min(32, "phải dài ít nhất 32 ký tự (tạo bằng: openssl rand -hex 32)").optional(),
  /** ID khóa Tutor LMS được tính là N1 (video 3584, trực tuyến 3599). */
  SUAI_COURSE_IDS: z
    .string()
    .default("3584,3599")
    .transform((value) => value.split(",").map((id) => id.trim()).filter(Boolean)),
  /** Máy chủ Jitsi cho giờ hỗ trợ. JITSI_APP_ID/SECRET: đặt khi meet.suai.vn bật xác thực JWT. */
  JITSI_DOMAIN: z.string().default("meet.suai.vn"),
  JITSI_APP_ID: z.string().optional(),
  JITSI_APP_SECRET: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.APP_ENV === "production" && value.EMAIL_TRANSPORT !== "brevo") {
    ctx.addIssue({ code: "custom", path: ["EMAIL_TRANSPORT"], message: "production phải dùng brevo" });
  }
  if (value.EMAIL_TRANSPORT === "brevo" && !value.BREVO_API_KEY) {
    ctx.addIssue({ code: "custom", path: ["BREVO_API_KEY"], message: "chưa được đặt (bắt buộc khi dùng brevo)" });
  }
  if (value.APP_ENV === "production" && value.STORAGE_DRIVER !== "drive") {
    ctx.addIssue({ code: "custom", path: ["STORAGE_DRIVER"], message: "production phải lưu file trên Google Drive (drive)" });
  }
  if (value.STORAGE_DRIVER === "drive" && (!value.GOOGLE_CLIENT_ID || !value.GOOGLE_CLIENT_SECRET)) {
    ctx.addIssue({
      code: "custom",
      path: ["GOOGLE_CLIENT_SECRET"],
      message: "chưa được đặt (lưu file trên Google Drive cần GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET)",
    });
  }
  if (Boolean(value.GOOGLE_CLIENT_ID) !== Boolean(value.GOOGLE_CLIENT_SECRET)) {
    ctx.addIssue({ code: "custom", path: ["GOOGLE_CLIENT_SECRET"], message: "phải đặt cả GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET" });
  }
  if (Boolean(value.JITSI_APP_ID) !== Boolean(value.JITSI_APP_SECRET)) {
    ctx.addIssue({ code: "custom", path: ["JITSI_APP_SECRET"], message: "phải đặt cả JITSI_APP_ID và JITSI_APP_SECRET" });
  }
  if (value.EMAIL_TRANSPORT === "memory" && value.NODE_ENV !== "test") {
    ctx.addIssue({ code: "custom", path: ["EMAIL_TRANSPORT"], message: "memory chỉ dùng khi chạy test" });
  }
});

export type Env = z.infer<typeof EnvSchema>;

/** Kiểm tra biến môi trường. Thông báo lỗi chỉ nêu tên biến, không in giá trị (có thể là secret). */
export function parseEnv(source: Record<string, string | undefined>): Env {
  // KEY= (để trống) trong file .env coi như chưa đặt, tránh lỗi "không phải URL" cho biến tùy chọn.
  const cleaned = Object.fromEntries(Object.entries(source).filter(([, value]) => value !== ""));
  const result = EnvSchema.safeParse(cleaned);
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
