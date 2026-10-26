import { Client } from "pg";
import { runMigrations } from "@/db/migrate";
import { TEST_DATABASE_URL } from "./test-db-url";

/** Trước mỗi lần chạy test: xóa sạch schema của database test rồi chạy lại toàn bộ migration. */
export default async function setup() {
  const name = new URL(TEST_DATABASE_URL).pathname.slice(1);
  if (!name.includes("test")) {
    throw new Error(`Từ chối dọn database "${name}": tên database test phải chứa chữ "test".`);
  }
  const client = new Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();
  await client.query("drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;");
  await client.end();
  await runMigrations(TEST_DATABASE_URL);
}
