import { describe, expect, it } from "vitest";
import { authorize, can, ForbiddenError, scopeFilter, type Actor, type RoleGrant, type Action, type Resource } from "@/modules/identity/policy";

const g = (role: RoleGrant["role"], scopeType: RoleGrant["scopeType"] = "global", scopeId: string | null = null): RoleGrant => ({
  role,
  scopeType,
  scopeId,
});

function actor(roles: RoleGrant[], extra: Partial<Actor> = {}): Actor {
  return { userId: "u-actor", status: "active", roles, ...extra };
}

// Hồ sơ học của SV "u-sv" ở Trường A, Khoa Kế toán, Lớp KT1; được phân công cho mentor/TA "u-actor".
const studentRecord = (overrides: Partial<Resource> = {}): Resource => ({
  kind: "student_record",
  ownerUserId: "u-sv",
  schoolId: "school-a",
  facultyId: "fac-kt",
  classId: "class-kt1",
  assignedStaffIds: ["u-actor"],
  ...overrides,
});
const submission = (overrides: Partial<Resource> = {}): Resource => ({ ...studentRecord(), kind: "submission", ...overrides });
const otherSchool = { schoolId: "school-b", facultyId: "fac-b", classId: "class-b1" };
const unassigned = { assignedStaffIds: ["u-other"] };
const schoolReportA: Resource = { kind: "school_report", schoolId: "school-a", facultyId: "fac-kt", classId: "class-kt1" };
const userAdmin: Resource = { kind: "user_admin" };
const userAdminTargetSuper: Resource = { kind: "user_admin", targetRoles: ["super_admin"] };
const auditLog: Resource = { kind: "audit_log" };

type Row = [string, Actor, Action, Resource, boolean];

const superAdmin = actor([g("super_admin")]);
const admin = actor([g("admin")]);
const institute = actor([g("institute_viewer")]);
const mentor = actor([g("mentor")]);
const ta = actor([g("ta")]);
const managerA = actor([g("school_manager", "school", "school-a")]);
const teacherSchoolA = actor([g("teacher", "school", "school-a")]);
const teacherFacultyKt = actor([g("teacher", "faculty", "fac-kt")]);
const teacherClassKt1 = actor([g("teacher", "class", "class-kt1")]);
const teacherClassKt2 = actor([g("teacher", "class", "class-kt2")]);
const student = actor([], { userId: "u-sv" });
const otherStudent = actor([], { userId: "u-sv-khac" });

const matrix: Row[] = [
  // Super Admin
  ["super_admin xem hồ sơ SV bất kỳ", superAdmin, "student_record.view", studentRecord(otherSchool), true],
  ["super_admin mời nhân sự", superAdmin, "user.invite_staff", userAdmin, true],
  ["super_admin cấp quyền super_admin", superAdmin, "role.grant_super_admin", userAdmin, true],
  ["super_admin quản lý tài khoản super_admin khác", superAdmin, "user.manage", userAdminTargetSuper, true],
  ["super_admin xem nhật ký", superAdmin, "audit.view", auditLog, true],
  // Admin
  ["admin mời nhân sự", admin, "user.invite_staff", userAdmin, true],
  ["admin khóa tài khoản thường", admin, "user.manage", userAdmin, true],
  ["admin KHÔNG cấp quyền super_admin", admin, "role.grant_super_admin", userAdmin, false],
  ["admin KHÔNG quản lý tài khoản super_admin", admin, "user.manage", userAdminTargetSuper, false],
  ["admin xem nhật ký", admin, "audit.view", auditLog, true],
  ["admin xem báo cáo mọi trường", admin, "school_report.view", schoolReportA, true],
  // Viện ĐT Bách Khoa (chỉ đọc)
  ["Viện xem hồ sơ SV mọi trường", institute, "student_record.view", studentRecord(otherSchool), true],
  ["Viện xuất báo cáo", institute, "school_report.export", schoolReportA, true],
  ["Viện KHÔNG chấm bài", institute, "submission.review", submission(), false],
  ["Viện KHÔNG mời nhân sự", institute, "user.invite_staff", userAdmin, false],
  ["Viện KHÔNG xem nhật ký", institute, "audit.view", auditLog, false],
  // Mentor
  ["mentor xem bài SV được phân công", mentor, "submission.view", submission(), true],
  ["mentor chấm bài SV được phân công", mentor, "submission.review", submission(), true],
  ["mentor KHÔNG xem bài SV không được phân công", mentor, "submission.view", submission(unassigned), false],
  ["mentor KHÔNG chấm bài SV không được phân công", mentor, "submission.review", submission(unassigned), false],
  ["mentor xem hồ sơ SV được phân công", mentor, "student_record.view", studentRecord(), true],
  ["mentor KHÔNG xem bài chưa phân công cho ai", mentor, "submission.view", submission({ assignedStaffIds: undefined }), false],
  ["mentor KHÔNG nộp bài thay SV được phân công", mentor, "submission.create", submission(), false],
  ["mentor KHÔNG xem báo cáo trường", mentor, "school_report.view", schoolReportA, false],
  ["mentor KHÔNG mời nhân sự", mentor, "user.invite_staff", userAdmin, false],
  // TA
  ["TA xem bài SV được phân công", ta, "submission.view", submission(), true],
  ["TA kiểm hồ sơ bài SV được phân công", ta, "submission.precheck", submission(), true],
  ["TA KHÔNG chấm chính thức", ta, "submission.review", submission(), false],
  ["TA KHÔNG xem bài SV không được phân công", ta, "submission.view", submission(unassigned), false],
  // Quản lý trường
  ["QL trường A xem hồ sơ SV trường A", managerA, "student_record.view", studentRecord(unassigned), true],
  ["QL trường A KHÔNG xem hồ sơ SV trường B", managerA, "student_record.view", studentRecord(otherSchool), false],
  ["QL trường A xuất báo cáo trường A", managerA, "school_report.export", schoolReportA, true],
  ["QL trường A KHÔNG xuất báo cáo trường B", managerA, "school_report.export", { ...schoolReportA, ...otherSchool }, false],
  ["QL trường KHÔNG chấm bài", managerA, "submission.review", submission(), false],
  ["QL trường KHÔNG mời nhân sự", managerA, "user.invite_staff", userAdmin, false],
  // Giáo viên
  ["GV gán trường A xem SV trường A", teacherSchoolA, "student_record.view", studentRecord(), true],
  ["GV gán khoa KT xem SV khoa KT", teacherFacultyKt, "student_record.view", studentRecord(), true],
  ["GV gán khoa KT KHÔNG xem SV khoa khác", teacherFacultyKt, "student_record.view", studentRecord({ facultyId: "fac-qtkd", classId: "class-q1" }), false],
  ["GV gán lớp KT1 xem SV lớp KT1", teacherClassKt1, "student_record.view", studentRecord(), true],
  ["GV gán lớp KT2 KHÔNG xem SV lớp KT1", teacherClassKt2, "student_record.view", studentRecord(), false],
  ["GV gán lớp KT1 KHÔNG xem SV trường B", teacherClassKt1, "student_record.view", studentRecord(otherSchool), false],
  ["GV xem báo cáo lớp mình", teacherClassKt1, "school_report.view", schoolReportA, true],
  ["GV xem bài nộp SV trong phạm vi", teacherFacultyKt, "submission.view", submission(unassigned), true],
  ["GV KHÔNG chấm bài", teacherFacultyKt, "submission.review", submission(), false],
  ["GV KHÔNG xem nhật ký", teacherSchoolA, "audit.view", auditLog, false],
  // Sinh viên
  ["SV xem hồ sơ của mình", student, "student_record.view", studentRecord(), true],
  ["SV nộp bài của mình", student, "submission.create", submission(), true],
  ["SV KHÔNG xem hồ sơ SV khác", otherStudent, "student_record.view", studentRecord(), false],
  ["SV KHÔNG nộp bài thay SV khác", otherStudent, "submission.create", submission(), false],
  ["SV KHÔNG tự chấm bài", student, "submission.review", submission(), false],
  ["SV KHÔNG xem báo cáo trường", student, "school_report.view", schoolReportA, false],
  // Quản lý trường/khoa/lớp/sự kiện
  ["admin quản lý trường, sự kiện", admin, "org.manage", { kind: "org" }, true],
  ["Viện KHÔNG sửa danh mục trường", institute, "org.manage", { kind: "org" }, false],
  ["QL trường KHÔNG sửa danh mục trường", managerA, "org.manage", { kind: "org", schoolId: "school-a" }, false],
  ["SV KHÔNG sửa danh mục trường", student, "org.manage", { kind: "org" }, false],
  // Tài khoản bị khóa, nhiều vai trò
  ["super_admin bị khóa thì không làm gì được", actor([g("super_admin")], { status: "suspended" }), "student_record.view", studentRecord(), false],
  ["SV bị khóa không nộp được bài", actor([], { userId: "u-sv", status: "suspended" }), "submission.create", submission(), false],
  ["người vừa là mentor vừa là TA vẫn chấm được", actor([g("mentor"), g("ta")]), "submission.review", submission(), true],
  ["không có vai trò thì không mời được nhân sự", actor([]), "user.invite_staff", userAdmin, false],
];

describe("Ma trận phân quyền", () => {
  it("có ít nhất 40 trường hợp", () => {
    expect(matrix.length).toBeGreaterThanOrEqual(40);
  });

  it.each(matrix)("%s", (_name, who, action, resource, expected) => {
    expect(can(who, action, resource)).toBe(expected);
  });
});

describe("scopeFilter", () => {
  it("admin, super_admin, Viện thấy toàn bộ", () => {
    for (const who of [superAdmin, admin, institute]) expect(scopeFilter(who)).toEqual({ all: true });
  });

  it("tài khoản bị khóa không thấy gì", () => {
    expect(scopeFilter(actor([g("admin")], { status: "suspended" }))).toEqual({ none: true });
  });

  it("gộp phạm vi trường/khoa/lớp, phân công và hồ sơ của chính mình", () => {
    const who = actor([g("school_manager", "school", "school-a"), g("teacher", "class", "class-x"), g("mentor")]);
    expect(scopeFilter(who)).toEqual({
      schoolIds: ["school-a"],
      facultyIds: [],
      classIds: ["class-x"],
      assignedToUserId: "u-actor",
      ownerUserId: "u-actor",
    });
  });

  it("SV chỉ thấy dữ liệu của mình", () => {
    expect(scopeFilter(student)).toEqual({
      schoolIds: [],
      facultyIds: [],
      classIds: [],
      assignedToUserId: null,
      ownerUserId: "u-sv",
    });
  });
});

describe("authorize", () => {
  it("không ném lỗi khi có quyền", () => {
    expect(() => authorize(superAdmin, "audit.view", auditLog)).not.toThrow();
  });

  it("ném ForbiddenError khi không có quyền", () => {
    expect(() => authorize(student, "audit.view", auditLog)).toThrow(ForbiddenError);
  });

  it("vai trò theo phạm vi mà thiếu scopeId hoặc gán sai kiểu phạm vi thì không có hiệu lực", () => {
    const broken = actor([g("teacher", "school", null), g("school_manager", "global")]);
    expect(can(broken, "student_record.view", studentRecord(unassigned))).toBe(false);
  });
});
