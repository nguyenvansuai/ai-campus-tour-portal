import { TEST_DATABASE_URL } from "./test-db-url";

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.APP_URL ??= "http://localhost:3000";
