import { can, type Actor } from "@/modules/identity/policy";
import type { IconName } from "./icons";

export type NavItem = { href: string; label: string; icon: IconName };
export type NavSection = { title: string; items: NavItem[] };

const has = (actor: Actor, ...roles: string[]) => actor.roles.some((r) => roles.includes(r.role));

/** Menu theo vai trò. Một người có nhiều vai trò thấy đủ các nhóm tương ứng. */
export function buildNav(actor: Actor, options: { isStudent: boolean }): NavSection[] {
  const sections: NavSection[] = [];
  if (options.isStudent) {
    sections.push({
      title: "Học tập",
      items: [
        { href: "/hoc", label: "Lộ trình của tôi", icon: "home" },
        { href: "/hoc/du-an", label: "Dự án cuối & chứng nhận", icon: "trophy" },
        { href: "/hoc/ho-tro", label: "Giờ hỗ trợ trực tuyến", icon: "video" },
        { href: "/hoc/khoa-su-ai", label: "Khóa Sự AI", icon: "star" },
      ],
    });
  }
  if (has(actor, "super_admin", "admin", "mentor", "ta")) {
    sections.push({
      title: "Nhân sự",
      items: [
        { href: "/nhan-su", label: "Chấm báo cáo", icon: "check" },
        { href: "/nhan-su/du-an", label: "Chấm dự án cuối", icon: "clipboard" },
        { href: "/nhan-su/ho-tro", label: "Giờ hỗ trợ", icon: "video" },
        { href: "/nhan-su/khoa-su-ai", label: "Khóa Sự AI", icon: "star" },
      ],
    });
  }
  if (actor.roles.length > 0) {
    const items: NavItem[] = [{ href: "/truong", label: "Tiến độ sinh viên", icon: "chart" }];
    if (has(actor, "super_admin", "admin", "institute_viewer") || actor.roles.some((r) => r.role === "school_manager" && r.scopeType === "school")) {
      items.push({ href: "/truong/chung-nhan", label: "Duyệt chứng nhận", icon: "badge" });
    }
    sections.push({ title: "Theo dõi", items });
  }
  if (can(actor, "user.view_list", { kind: "user_admin" })) {
    const items: NavItem[] = [
      { href: "/admin", label: "Tổng quan", icon: "chart" },
      { href: "/admin/nguoi-dung", label: "Người dùng", icon: "users" },
    ];
    if (can(actor, "org.manage", { kind: "org" })) {
      items.push({ href: "/admin/truong", label: "Trường, khoa, lớp", icon: "building" }, { href: "/admin/su-kien", label: "Sự kiện & mã", icon: "calendar" });
    }
    if (can(actor, "certificate.revoke", { kind: "certificate" })) items.push({ href: "/admin/chung-nhan", label: "Chứng nhận đã cấp", icon: "badge" });
    if (can(actor, "system.configure", { kind: "system" })) items.push({ href: "/admin/luu-tru", label: "Lưu trữ Google Drive", icon: "cloud" });
    if (can(actor, "audit.view", { kind: "audit_log" })) items.push({ href: "/admin/nhat-ky", label: "Nhật ký", icon: "list" });
    sections.push({ title: "Quản trị", items });
  }
  sections.push({ title: "Tài khoản", items: [{ href: "/tai-khoan/thiet-bi", label: "Thiết bị đăng nhập", icon: "device" }] });
  return sections;
}

/** Mục đang mở: khớp tiền tố dài nhất, để /hoc/du-an không làm sáng cả /hoc. */
export function activeHref(sections: NavSection[], pathname: string) {
  const hrefs = sections.flatMap((s) => s.items.map((i) => i.href));
  return hrefs.filter((href) => pathname === href || pathname.startsWith(`${href}/`)).sort((a, b) => b.length - a.length)[0] ?? null;
}
