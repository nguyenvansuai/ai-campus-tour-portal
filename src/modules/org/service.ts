import { and, asc, eq, gt, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { authorize, type Actor } from "@/modules/identity/policy";
import { generateActivationCode, normalizeName } from "./codes";
import { activationCode, event, faculty, school, schoolClass } from "./schema";

const ORG = { kind: "org" } as const;
const Name = z.string().transform(normalizeName).pipe(z.string().min(2, "Tên quá ngắn.").max(200));

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "cause" in error
    ? (error as { cause?: { code?: string } }).cause?.code === "23505"
    : (error as { code?: string })?.code === "23505";
}

async function insertUnique<T>(task: () => Promise<T>, message: string): Promise<T> {
  try {
    return await task();
  } catch (error) {
    if (isUniqueViolation(error)) throw new Error(message);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Trường, khoa, lớp

export const CreateSchoolInput = z.object({
  name: Name,
  shortName: z.string().trim().max(30).optional().nullable(),
  connected: z.boolean().optional(),
});

export async function createSchool(actor: Actor, raw: z.input<typeof CreateSchoolInput>) {
  authorize(actor, "org.manage", ORG);
  const input = CreateSchoolInput.parse(raw);
  const [row] = await insertUnique(
    () =>
      db
        .insert(school)
        .values({ name: input.name, shortName: input.shortName || null, connected: input.connected ?? false, status: "verified", createdBy: actor.userId })
        .returning(),
    "Trường này đã có trong danh sách.",
  );
  await recordAudit({ actorId: actor.userId, action: "org.school_created", targetType: "school", targetId: row!.id, metadata: { name: input.name } });
  return row!;
}

export async function updateSchool(
  actor: Actor,
  schoolId: string,
  patch: { name?: string; shortName?: string | null; connected?: boolean; status?: "verified" | "pending" },
) {
  authorize(actor, "org.manage", ORG);
  const values = { ...patch, ...(patch.name ? { name: Name.parse(patch.name) } : {}) };
  await insertUnique(() => db.update(school).set(values).where(eq(school.id, schoolId)), "Trường này đã có trong danh sách.");
  await recordAudit({ actorId: actor.userId, action: "org.school_updated", targetType: "school", targetId: schoolId, metadata: patch });
}

export async function createFaculty(actor: Actor, raw: { schoolId: string; name: string }) {
  authorize(actor, "org.manage", ORG);
  const name = Name.parse(raw.name);
  const [row] = await insertUnique(() => db.insert(faculty).values({ schoolId: raw.schoolId, name }).returning(), "Khoa này đã có.");
  return row!;
}

export async function createClass(actor: Actor, raw: { facultyId: string; name: string }) {
  authorize(actor, "org.manage", ORG);
  const name = z.string().transform(normalizeName).pipe(z.string().min(1).max(100)).parse(raw.name);
  const [row] = await insertUnique(() => db.insert(schoolClass).values({ facultyId: raw.facultyId, name }).returning(), "Lớp này đã có.");
  return row!;
}

/** SV tự khai trường: tìm theo tên (không phân biệt hoa thường), chưa có thì tạo trường chờ xác minh. */
export async function findOrCreateSchoolBySelfReport(rawName: string, userId: string | null) {
  const name = Name.parse(rawName);
  await db
    .insert(school)
    .values({ name, status: "pending", connected: false, createdBy: userId })
    .onConflictDoNothing();
  const [row] = await db.select().from(school).where(sql`lower(${school.name}) = lower(${name})`);
  return row!;
}

/** Tìm hoặc tạo khoa/lớp do SV tự nhập trong một trường. */
export async function findOrCreateFacultyAndClass(schoolId: string, facultyName: string, className: string | null) {
  const fName = Name.parse(facultyName);
  await db.insert(faculty).values({ schoolId, name: fName }).onConflictDoNothing();
  const [f] = await db.select().from(faculty).where(and(eq(faculty.schoolId, schoolId), sql`lower(${faculty.name}) = lower(${fName})`));
  let c: typeof schoolClass.$inferSelect | undefined;
  if (className?.trim()) {
    const cName = normalizeName(className);
    await db.insert(schoolClass).values({ facultyId: f!.id, name: cName }).onConflictDoNothing();
    [c] = await db.select().from(schoolClass).where(and(eq(schoolClass.facultyId, f!.id), sql`lower(${schoolClass.name}) = lower(${cName})`));
  }
  return { faculty: f!, schoolClass: c ?? null };
}

/** Danh sách trường đã xác minh kèm khoa/lớp, dùng cho ô chọn khi đăng ký và khi mời GV. */
export async function listSchoolsForPicker(options: { includePending?: boolean } = {}) {
  const schools = await db
    .select()
    .from(school)
    .where(options.includePending ? undefined : eq(school.status, "verified"))
    .orderBy(asc(school.name));
  const faculties = await db.select().from(faculty).orderBy(asc(faculty.name));
  const classes = await db.select().from(schoolClass).orderBy(asc(schoolClass.name));
  return schools.map((s) => ({
    ...s,
    faculties: faculties
      .filter((f) => f.schoolId === s.id)
      .map((f) => ({ ...f, classes: classes.filter((c) => c.facultyId === f.id) })),
  }));
}

type MergeHook = (tx: Parameters<Parameters<typeof db.transaction>[0]>[0], ids: { keepId: string; removeId: string; facultyMap: Map<string, string> }) => Promise<void>;
const mergeHooks: MergeHook[] = [];

/** Module khác (vd. enrollment) đăng ký để chuyển dữ liệu của mình khi gộp trường. */
export function onSchoolMerge(hook: MergeHook) {
  mergeHooks.push(hook);
}

/** Gộp trường trùng: chuyển khoa/lớp sang trường giữ lại (khoa trùng tên thì gộp lớp), rồi xóa trường thừa. */
export async function mergeSchools(actor: Actor, ids: { keepId: string; removeId: string }) {
  authorize(actor, "org.manage", ORG);
  if (ids.keepId === ids.removeId) throw new Error("Hai trường phải khác nhau.");
  await db.transaction(async (tx) => {
    const keepFaculties = await tx.select().from(faculty).where(eq(faculty.schoolId, ids.keepId));
    const removeFaculties = await tx.select().from(faculty).where(eq(faculty.schoolId, ids.removeId));
    const facultyMap = new Map<string, string>();
    for (const f of removeFaculties) {
      const same = keepFaculties.find((k) => k.name.toLowerCase() === f.name.toLowerCase());
      if (!same) {
        await tx.update(faculty).set({ schoolId: ids.keepId }).where(eq(faculty.id, f.id));
        facultyMap.set(f.id, f.id);
        continue;
      }
      facultyMap.set(f.id, same.id);
      const keepClasses = await tx.select().from(schoolClass).where(eq(schoolClass.facultyId, same.id));
      for (const c of await tx.select().from(schoolClass).where(eq(schoolClass.facultyId, f.id))) {
        if (!keepClasses.some((k) => k.name.toLowerCase() === c.name.toLowerCase())) {
          await tx.update(schoolClass).set({ facultyId: same.id }).where(eq(schoolClass.id, c.id));
        }
      }
    }
    await tx.update(event).set({ schoolId: ids.keepId }).where(eq(event.schoolId, ids.removeId));
    for (const hook of mergeHooks) await hook(tx, { ...ids, facultyMap });
    await tx.delete(school).where(eq(school.id, ids.removeId));
    await recordAudit({ actorId: actor.userId, action: "org.school_merged", targetType: "school", targetId: ids.keepId, metadata: { removedId: ids.removeId } }, tx);
  });
}

// ---------------------------------------------------------------------------
// Sự kiện workshop và mã kích hoạt

export async function createEvent(actor: Actor, raw: { schoolId: string; name: string; heldOn: string }) {
  authorize(actor, "org.manage", ORG);
  const input = z.object({ schoolId: z.uuid(), name: Name, heldOn: z.iso.date() }).parse(raw);
  const [row] = await db.insert(event).values({ ...input, createdBy: actor.userId }).returning();
  await recordAudit({ actorId: actor.userId, action: "org.event_created", targetType: "event", targetId: row!.id, metadata: input });
  return row!;
}

export async function createActivationCode(actor: Actor, raw: { eventId: string; maxUses: number; validDays: number }) {
  authorize(actor, "org.manage", ORG);
  const input = z.object({ eventId: z.uuid(), maxUses: z.int().min(1).max(5000), validDays: z.int().min(1).max(365) }).parse(raw);
  for (let attempt = 0; attempt < 5; attempt++) {
    const [row] = await db
      .insert(activationCode)
      .values({ eventId: input.eventId, code: generateActivationCode(), maxUses: input.maxUses, expiresAt: new Date(Date.now() + input.validDays * 86_400_000) })
      .onConflictDoNothing()
      .returning();
    if (row) {
      await recordAudit({ actorId: actor.userId, action: "org.code_created", targetType: "activation_code", targetId: row.id, metadata: { eventId: input.eventId, maxUses: input.maxUses } });
      return row;
    }
  }
  throw new Error("Không tạo được mã, vui lòng thử lại.");
}

export type RedeemResult = { ok: true; eventId: string; schoolId: string; codeId: string } | { ok: false; reason: string };

/** Dùng một lượt của mã. Tăng bộ đếm bằng một câu lệnh có điều kiện, nên nhiều request cùng lúc không vượt giới hạn. */
export async function redeemActivationCode(rawCode: string): Promise<RedeemResult> {
  const code = rawCode.trim().toUpperCase();
  const [updated] = await db
    .update(activationCode)
    .set({ usedCount: sql`${activationCode.usedCount} + 1` })
    .where(and(eq(activationCode.code, code), gt(activationCode.expiresAt, new Date()), lt(activationCode.usedCount, activationCode.maxUses)))
    .returning({ id: activationCode.id, eventId: activationCode.eventId });
  if (updated) {
    const [ev] = await db.select({ schoolId: event.schoolId }).from(event).where(eq(event.id, updated.eventId));
    return { ok: true, eventId: updated.eventId, schoolId: ev!.schoolId, codeId: updated.id };
  }
  const [existing] = await db.select().from(activationCode).where(eq(activationCode.code, code));
  if (!existing) return { ok: false, reason: "Mã không đúng." };
  if (existing.expiresAt <= new Date()) return { ok: false, reason: "Mã đã hết hạn." };
  return { ok: false, reason: "Mã đã dùng hết lượt." };
}

/** Kiểm tra mã mà không dùng lượt (để điền sẵn trường trên form đăng ký). */
export async function peekActivationCode(rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  const [row] = await db
    .select({ code: activationCode.code, expiresAt: activationCode.expiresAt, usedCount: activationCode.usedCount, maxUses: activationCode.maxUses, schoolId: event.schoolId, eventName: event.name })
    .from(activationCode)
    .innerJoin(event, eq(event.id, activationCode.eventId))
    .where(eq(activationCode.code, code));
  if (!row || row.expiresAt <= new Date() || row.usedCount >= row.maxUses) return null;
  return row;
}

export async function listEventsWithCodes(actor: Actor) {
  authorize(actor, "org.manage", ORG);
  const events = await db
    .select({ id: event.id, name: event.name, heldOn: event.heldOn, schoolId: event.schoolId, schoolName: school.name })
    .from(event)
    .innerJoin(school, eq(school.id, event.schoolId))
    .orderBy(sql`${event.heldOn} desc`);
  const codes = await db.select().from(activationCode).orderBy(asc(activationCode.createdAt));
  return events.map((e) => ({ ...e, codes: codes.filter((c) => c.eventId === e.id) }));
}

export type ScopeOption = { scopeType: "school" | "faculty" | "class"; scopeId: string; label: string };

/** Danh sách phạm vi (trường / khoa / lớp) kèm nhãn đầy đủ, dùng cho ô chọn và để hiển thị tên thay cho mã. */
export async function listScopeOptions(): Promise<ScopeOption[]> {
  const schools = await listSchoolsForPicker({ includePending: true });
  return schools.flatMap((s) => [
    { scopeType: "school" as const, scopeId: s.id, label: s.name },
    ...s.faculties.flatMap((f) => [
      { scopeType: "faculty" as const, scopeId: f.id, label: `${s.name} – ${f.name}` },
      ...f.classes.map((c) => ({ scopeType: "class" as const, scopeId: c.id, label: `${s.name} – ${f.name} – ${c.name}` })),
    ]),
  ]);
}
