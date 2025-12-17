import { drizzle } from "npm:drizzle-orm/sql-js";
import initSqlJs from "npm:sql.js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const POOL_CONFIG = {
  maxConnections: 1, 
  connectionTimeout: 5000,
  idleTimeout: 10000,
  path: "./db/tasks.db"
};

class SQLiteConnectionManager {
  private static instance: any = null;
  private isConnecting: boolean = false;
  
  // 🆔 İŞTE KANIT: Her havuzun benzersiz bir kimliği olur
  public readonly poolId: string;

  constructor() {
    // Havuz oluştuğu saniye rastgele bir kimlik üretir (Örn: "pool-a1b2")
    this.poolId = `pool-${Math.random().toString(36).substring(2, 9)}`;
  }

  async getConnection() {
    if (SQLiteConnectionManager.instance) return SQLiteConnectionManager.instance;

    if (this.isConnecting) {
      while (!SQLiteConnectionManager.instance) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return SQLiteConnectionManager.instance;
    }

    this.isConnecting = true;
    console.log(`🔌 Initializing Connection Pool (ID: ${this.poolId})...`);

    const SQL = await initSqlJs();
    let filebuffer;

    try {
      if (existsSync(POOL_CONFIG.path)) filebuffer = readFileSync(POOL_CONFIG.path);
    } catch (e) {}

    const db = new SQL.Database(filebuffer);
    
    try {
        db.run("PRAGMA journal_mode = WAL;"); 
        db.run("PRAGMA synchronous = NORMAL;");
    } catch (e) {}

    SQLiteConnectionManager.instance = db;
    this.isConnecting = false;
    return db;
  }

  exportToDisk() {
    if (SQLiteConnectionManager.instance) {
        try {
            const data = SQLiteConnectionManager.instance.export();
            writeFileSync(POOL_CONFIG.path, Buffer.from(data));
        } catch (e) {}
    }
  }
}

export const poolManager = new SQLiteConnectionManager();

const client = await poolManager.getConnection();
export const orm = drizzle(client);
export const dbClient = client;