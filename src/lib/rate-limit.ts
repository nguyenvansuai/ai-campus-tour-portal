import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type RateLimitRule = { max: number; windowSeconds: number };
export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

/** Tăng bộ đếm của `key` (một câu lệnh, an toàn khi nhiều request cùng lúc) và cho biết còn được phép không. */
export async function consumeRateLimit(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
  const window = `${rule.windowSeconds} seconds`;
  const result = await db.execute<{ count: number; retry_after: number }>(sql`
    insert into rate_limit_bucket as b (key, count, window_start)
    values (${key}, 1, now())
    on conflict (key) do update set
      count = case when b.window_start <= now() - ${window}::interval then 1 else b.count + 1 end,
      window_start = case when b.window_start <= now() - ${window}::interval then now() else b.window_start end
    returning count, ceil(extract(epoch from (window_start + ${window}::interval - now())))::int as retry_after
  `);
  const row = result.rows[0]!;
  return { allowed: row.count <= rule.max, retryAfterSeconds: Math.max(row.retry_after, 1) };
}
