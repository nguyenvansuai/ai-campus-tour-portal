import { runMigrations } from "@/db/migrate";
import { env } from "@/lib/env";

async function main() {
  await runMigrations(env().DATABASE_URL);
  console.log("Đã chạy xong migration.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
