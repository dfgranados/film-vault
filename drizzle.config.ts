import { defineConfig } from "drizzle-kit";
import path from "path";
import os from "os";

const defaultLibraryRoot = path.join(os.homedir(), "FilmVault");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: path.join(defaultLibraryRoot, "data", "filmvault.db"),
  },
});
