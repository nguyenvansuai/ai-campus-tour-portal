import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

export type Database = NodePgDatabase<typeof schema>;

let pool: Pool | undefined;
let instance: Database | undefined;

function getDb(): Database {
  if (!instance) {
    pool = new Pool({ connectionString: env().DATABASE_URL, max: 10 });
    instance = drizzle(pool, { schema });
  }
  return instance;
}

/** Kết nối được tạo ở lần dùng đầu tiên, để build không cần database. */
export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
});

export async function closeDb() {
  await pool?.end();
  pool = undefined;
  instance = undefined;
}
