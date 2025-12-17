// backend/drizzle.config.ts
import { defineConfig } from "npm:drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./db/tasks.db",
  },
});
