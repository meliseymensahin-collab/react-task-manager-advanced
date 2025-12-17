import { poolManager } from "./drizzle.ts";

export const saveDb = async () => {
  // Pool Manager üzerinden diske yaz
  poolManager.exportToDisk();
};