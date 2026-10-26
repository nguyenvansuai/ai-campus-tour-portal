import { TEST_DATABASE_URL } from "./test-db-url";

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.APP_URL ??= "http://localhost:3000";
process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret-123";
process.env.EMAIL_TRANSPORT = "memory";
