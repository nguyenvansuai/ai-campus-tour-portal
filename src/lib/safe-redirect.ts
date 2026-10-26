/** Chỉ cho phép chuyển hướng tới đường dẫn nội bộ (chống open redirect). */
export function safeNextPath(value: unknown, fallback = "/hoc") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
