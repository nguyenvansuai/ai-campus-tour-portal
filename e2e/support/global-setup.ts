import resetTestDatabase from "../../tests/setup/db-global";
import { clearOutbox } from "./outbox";

export default async function globalSetup() {
  await resetTestDatabase();
  await clearOutbox();
}
