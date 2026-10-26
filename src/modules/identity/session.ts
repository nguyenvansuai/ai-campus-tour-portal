import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Trang cần đăng nhập: chưa có phiên thì chuyển về /dang-nhap. */
export async function requireSession() {
  const current = await getCurrentSession();
  if (!current) redirect("/dang-nhap");
  return current;
}
