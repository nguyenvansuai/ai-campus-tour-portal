import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getCurrentSession() {
  // Đọc headers() trước để Next.js biết trang này render theo từng request (không prerender lúc build).
  const requestHeaders = await headers();
  return auth.api.getSession({ headers: requestHeaders });
}

/** Trang cần đăng nhập: chưa có phiên thì chuyển về /dang-nhap. */
export async function requireSession() {
  const current = await getCurrentSession();
  if (!current) redirect("/dang-nhap");
  return current;
}
