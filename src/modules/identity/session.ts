import "server-only";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { getActor, getValidSession } from "./actor";
import { can, type Action, type Actor, type Resource } from "./policy";

export async function getCurrentSession() {
  // Đọc headers() trước để Next.js biết trang này render theo từng request (không prerender lúc build).
  const requestHeaders = await headers();
  return getValidSession(requestHeaders);
}

/** Trang cần đăng nhập: chưa có phiên thì chuyển về /dang-nhap. */
export async function requireSession() {
  const current = await getCurrentSession();
  if (!current) redirect("/dang-nhap");
  return current;
}

/** Actor của request hiện tại; chưa đăng nhập thì chuyển về /dang-nhap, tài khoản bị khóa thì 403. */
export async function requireActor(): Promise<Actor> {
  const actor = await getActor(await headers());
  if (!actor) redirect("/dang-nhap");
  if (actor.status !== "active") forbidden();
  return actor;
}

/** Dùng trong trang và server action: không đủ quyền thì hiện trang 403. */
export async function requirePermission(action: Action, resource: Resource): Promise<Actor> {
  const actor = await requireActor();
  if (!can(actor, action, resource)) forbidden();
  return actor;
}
