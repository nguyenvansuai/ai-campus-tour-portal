import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import { getSecretSetting, setSecretSetting } from "@/lib/settings";
import { resetDatabase } from "../setup/reset";

beforeEach(resetDatabase);
afterAll(closeDb);

describe("Cấu hình bí mật", () => {
  it("lưu mã hóa (không lưu dạng đọc được), đọc lại đúng, ghi đè được", async () => {
    await setSecretSetting("k", "refresh-token-bi-mat", null);
    const raw = await db.execute<{ value: string }>(sql`select value from system_setting where key = 'k'`);
    expect(raw.rows[0]?.value).not.toContain("refresh-token-bi-mat");
    expect(await getSecretSetting("k")).toBe("refresh-token-bi-mat");
    await setSecretSetting("k", "moi", null);
    expect(await getSecretSetting("k")).toBe("moi");
    expect(await getSecretSetting("khong-co")).toBeNull();
  });
});
