import { describe, expect, it } from "vitest";
import { activeHref, buildNav } from "@/components/shell/nav";
import type { Actor, RoleGrant } from "@/modules/identity/policy";

const actor = (roles: RoleGrant[]): Actor => ({ userId: "u1", status: "active", roles });
const g = (role: RoleGrant["role"], scopeType: RoleGrant["scopeType"] = "global", scopeId: string | null = null): RoleGrant => ({ role, scopeType, scopeId });
const titles = (sections: ReturnType<typeof buildNav>) => sections.map((s) => s.title);
const hrefs = (sections: ReturnType<typeof buildNav>) => sections.flatMap((s) => s.items.map((i) => i.href));

describe("Menu theo vai trò", () => {
  it("SV chỉ thấy học tập và tài khoản", () => {
    expect(titles(buildNav(actor([]), { isStudent: true }))).toEqual(["Học tập", "Tài khoản"]);
  });

  it("mentor thấy chấm bài và theo dõi, không thấy quản trị", () => {
    const nav = buildNav(actor([g("mentor")]), { isStudent: false });
    expect(titles(nav)).toEqual(["Nhân sự", "Theo dõi", "Tài khoản"]);
    expect(hrefs(nav)).not.toContain("/truong/chung-nhan");
  });

  it("quản lý trường thấy duyệt chứng nhận; giáo viên thì không", () => {
    expect(hrefs(buildNav(actor([g("school_manager", "school", "s1")]), { isStudent: false }))).toContain("/truong/chung-nhan");
    expect(hrefs(buildNav(actor([g("teacher", "school", "s1")]), { isStudent: false }))).not.toContain("/truong/chung-nhan");
  });

  it("admin thấy quản trị nhưng không thấy lưu trữ (chỉ Super Admin)", () => {
    const admin = hrefs(buildNav(actor([g("admin")]), { isStudent: false }));
    expect(admin).toContain("/admin/nguoi-dung");
    expect(admin).not.toContain("/admin/luu-tru");
    expect(hrefs(buildNav(actor([g("super_admin")]), { isStudent: false }))).toContain("/admin/luu-tru");
  });

  it("mục đang mở là tiền tố dài nhất", () => {
    const nav = buildNav(actor([]), { isStudent: true });
    expect(activeHref(nav, "/hoc/du-an")).toBe("/hoc/du-an");
    expect(activeHref(nav, "/hoc/buoi/3")).toBe("/hoc");
    expect(activeHref(nav, "/hocx")).toBeNull();
  });
});
