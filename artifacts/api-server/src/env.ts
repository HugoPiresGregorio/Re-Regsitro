import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

let dir = process.cwd();
for (;;) {
  const candidate = join(dir, ".env");
  if (existsSync(candidate)) {
    config({ path: candidate });
    break;
  }
  const parent = dirname(dir);
  if (parent === dir) {
    config();
    break;
  }
  dir = parent;
}
