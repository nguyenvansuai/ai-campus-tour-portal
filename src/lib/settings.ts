import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { seal, unseal } from "@/lib/secret-box";
import { systemSetting } from "@/lib/settings-schema";

export async function getSecretSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(systemSetting).where(eq(systemSetting.key, key));
  return row ? unseal(row.value) : null;
}

export async function setSecretSetting(key: string, value: string, updatedBy: string | null) {
  const sealed = seal(value);
  await db
    .insert(systemSetting)
    .values({ key, value: sealed, updatedBy })
    .onConflictDoUpdate({ target: systemSetting.key, set: { value: sealed, updatedBy, updatedAt: new Date() } });
}

export async function deleteSetting(key: string) {
  await db.delete(systemSetting).where(eq(systemSetting.key, key));
}
