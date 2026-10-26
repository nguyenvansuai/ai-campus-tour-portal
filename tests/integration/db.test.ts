import { sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";

afterAll(async () => {
  await closeDb();
});

describe("kết nối Postgres", () => {
  it("chạy được truy vấn trên database test", async () => {
    const result = await db.execute<{ name: string }>(sql`select current_database() as name`);
    expect(result.rows[0]?.name).toMatch(/test/);
  });

  it("ghi và đọc lại dữ liệu", async () => {
    await db.execute(sql`create temporary table probe (id serial primary key, note text not null)`);
    await db.execute(sql`insert into probe (note) values ('xin chào')`);
    const result = await db.execute<{ note: string }>(sql`select note from probe`);
    expect(result.rows).toEqual([{ note: "xin chào" }]);
  });
});
