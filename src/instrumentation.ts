import { env } from "@/lib/env";

// Chạy một lần khi server khởi động: thiếu biến môi trường thì dừng ngay với thông báo rõ ràng.
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") env();
}
