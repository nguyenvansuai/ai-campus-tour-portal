import { closeDb } from "@/lib/db";
import { createSuperAdmin } from "@/modules/identity/admin-bootstrap";

async function main() {
  const email = process.argv[2];
  if (!email || !email.includes("@")) {
    console.error("Cách dùng: pnpm admin:create <email>");
    process.exit(1);
  }
  const result = await createSuperAdmin(email);
  console.log(result.created ? `Đã gán Super Admin cho ${email}.` : `${email} đã là Super Admin.`);
  await closeDb();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
