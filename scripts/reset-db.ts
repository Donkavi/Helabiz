/** Deletes the embedded development database. Run: npm run db:reset */
import fs from "node:fs";
import { DEV_DATA_DIR } from "../src/lib/db/mongoose";

if (fs.existsSync(DEV_DATA_DIR)) {
  fs.rmSync(DEV_DATA_DIR, { recursive: true, force: true });
  console.log(`Removed the embedded development database at ${DEV_DATA_DIR}`);
  console.log("Run `npm run seed` to recreate the demo data.");
} else {
  console.log("Nothing to remove — no embedded database exists yet.");
}
