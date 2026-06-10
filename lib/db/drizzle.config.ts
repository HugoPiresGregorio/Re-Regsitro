import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import path from "path";

let envDir = process.cwd();
for (;;) {
  const candidate = path.join(envDir, ".env");
  if (existsSync(candidate)) {
    loadEnv({ path: candidate });
    break;
  }
  const parent = path.dirname(envDir);
  if (parent === envDir) {
    loadEnv();
    break;
  }
  envDir = parent;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts").replace(/\\/g, "/"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
