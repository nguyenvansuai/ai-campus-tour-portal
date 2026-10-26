import { closeDb } from "@/lib/db";
import { runJobs } from "@/modules/notifications/service";

async function main() {
  const result = await runJobs();
  console.log(`[${new Date().toISOString()}] jobs`, JSON.stringify(result));
  await closeDb();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
