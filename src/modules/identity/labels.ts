import type { Role, ScopeType } from "./policy";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin vận hành",
  institute_viewer: "Viện ĐT Bách Khoa (chỉ xem)",
  mentor: "Mentor",
  ta: "Trợ giảng (TA)",
  school_manager: "Quản lý trường",
  teacher: "Giáo viên",
};

export const SCOPE_LABELS: Record<ScopeType, string> = {
  global: "Toàn hệ thống",
  school: "Trường",
  faculty: "Khoa",
  class: "Lớp",
};
