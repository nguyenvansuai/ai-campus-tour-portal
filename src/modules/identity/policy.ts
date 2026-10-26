// Kiểm tra quyền tập trung. Hàm thuần: không đọc database, chỉ dựa trên Actor và Resource được truyền vào.
// Mọi server action/route handler đều phải gọi `authorize` trước khi đọc hoặc ghi dữ liệu.

export const ROLES = [
  "super_admin",
  "admin",
  "institute_viewer",
  "mentor",
  "ta",
  "school_manager",
  "teacher",
] as const;
export type Role = (typeof ROLES)[number];

export const SCOPE_TYPES = ["global", "school", "faculty", "class"] as const;
export type ScopeType = (typeof SCOPE_TYPES)[number];

export type RoleGrant = { role: Role; scopeType: ScopeType; scopeId: string | null };

export type Actor = {
  userId: string;
  status: "active" | "suspended";
  /** Chỉ gồm vai trò còn hiệu lực (chưa bị thu hồi). */
  roles: RoleGrant[];
};

export type Action =
  | "user.invite_staff"
  | "user.view_list"
  | "user.manage"
  | "role.grant_super_admin"
  | "audit.view"
  | "student_record.view"
  | "submission.create"
  | "submission.view"
  | "submission.precheck"
  | "submission.review"
  | "school_report.view"
  | "school_report.export";

export type Resource = {
  kind: "user_admin" | "audit_log" | "student_record" | "submission" | "school_report";
  /** SV sở hữu dữ liệu. */
  ownerUserId?: string;
  schoolId?: string;
  facultyId?: string;
  classId?: string;
  /** Mentor/TA được phân công phụ trách SV này. */
  assignedStaffIds?: string[];
  /** Vai trò của tài khoản đang bị thao tác (với user_admin). */
  targetRoles?: Role[];
};

const ADMIN_ACTIONS: ReadonlySet<Action> = new Set(["user.invite_staff", "user.view_list", "user.manage", "audit.view"]);
const READ_ACTIONS: ReadonlySet<Action> = new Set(["student_record.view", "submission.view", "school_report.view", "school_report.export"]);
const SCOPED_ACTIONS: ReadonlySet<Action> = new Set(["student_record.view", "submission.view", "school_report.view", "school_report.export"]);

function has(actor: Actor, role: Role) {
  return actor.roles.some((grant) => grant.role === role);
}

/** Vai trò theo phạm vi (QL trường, GV) có phủ trường/khoa/lớp của tài nguyên không. */
function withinScope(actor: Actor, resource: Resource) {
  return actor.roles.some((grant) => {
    if (grant.role !== "school_manager" && grant.role !== "teacher") return false;
    switch (grant.scopeType) {
      case "school":
        return grant.scopeId !== null && grant.scopeId === resource.schoolId;
      case "faculty":
        return grant.scopeId !== null && grant.scopeId === resource.facultyId;
      case "class":
        return grant.scopeId !== null && grant.scopeId === resource.classId;
      default:
        return false;
    }
  });
}

function isAssigned(actor: Actor, resource: Resource) {
  return (resource.assignedStaffIds ?? []).includes(actor.userId);
}

function isOwner(actor: Actor, resource: Resource) {
  return resource.ownerUserId !== undefined && resource.ownerUserId === actor.userId;
}

export function can(actor: Actor, action: Action, resource: Resource): boolean {
  if (actor.status !== "active") return false;
  if (has(actor, "super_admin")) return true;

  if (has(actor, "admin")) {
    if (action === "role.grant_super_admin") return false;
    if (resource.targetRoles?.includes("super_admin")) return false;
    return true;
  }

  if (has(actor, "institute_viewer") && READ_ACTIONS.has(action)) return true;
  if (ADMIN_ACTIONS.has(action) || action === "role.grant_super_admin") return false;

  const assigned = isAssigned(actor, resource);
  if (has(actor, "mentor") && assigned) {
    if (action === "submission.view" || action === "submission.review" || action === "submission.precheck") return true;
    if (action === "student_record.view") return true;
  }
  if (has(actor, "ta") && assigned) {
    if (action === "submission.view" || action === "submission.precheck" || action === "student_record.view") return true;
  }

  if (SCOPED_ACTIONS.has(action) && withinScope(actor, resource)) return true;

  if (isOwner(actor, resource)) {
    return action === "student_record.view" || action === "submission.view" || action === "submission.create";
  }

  return false;
}

export class ForbiddenError extends Error {
  constructor(
    readonly action: Action,
    readonly resourceKind: Resource["kind"],
  ) {
    super(`Không có quyền thực hiện ${action} trên ${resourceKind}`);
    this.name = "ForbiddenError";
  }
}

export function authorize(actor: Actor, action: Action, resource: Resource): void {
  if (!can(actor, action, resource)) throw new ForbiddenError(action, resource.kind);
}

/**
 * Điều kiện lọc cho truy vấn danh sách (OR giữa các nhóm). Module khác dùng để dựng mệnh đề WHERE,
 * không được lấy hết dữ liệu rồi lọc ở client.
 */
export type ScopeFilter =
  | { all: true }
  | { none: true }
  | {
      schoolIds: string[];
      facultyIds: string[];
      classIds: string[];
      /** Dữ liệu của SV được phân công cho người này (mentor/TA). */
      assignedToUserId: string | null;
      /** Dữ liệu của chính người này (SV). */
      ownerUserId: string;
    };

export function scopeFilter(actor: Actor): ScopeFilter {
  if (actor.status !== "active") return { none: true };
  if (has(actor, "super_admin") || has(actor, "admin") || has(actor, "institute_viewer")) return { all: true };

  const idsOf = (type: ScopeType) =>
    actor.roles
      .filter((grant) => (grant.role === "school_manager" || grant.role === "teacher") && grant.scopeType === type && grant.scopeId)
      .map((grant) => grant.scopeId as string);

  return {
    schoolIds: idsOf("school"),
    facultyIds: idsOf("faculty"),
    classIds: idsOf("class"),
    assignedToUserId: has(actor, "mentor") || has(actor, "ta") ? actor.userId : null,
    ownerUserId: actor.userId,
  };
}
