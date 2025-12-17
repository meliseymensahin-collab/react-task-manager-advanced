// backend/setup_db.ts
// @v3.8 yerine en son sürümü (mod.ts) çağırıyoruz
import { DB } from "https://deno.land/x/sqlite/mod.ts";

console.log("Veritabanı hazırlanıyor...");

try {
  // Veritabanı dosyasını oluştur
  const db = new DB("./db/tasks.db");

  // 1. TASKS Tablosunu Kur
  db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      module TEXT
    );
  `);
  console.log("✅ Tasks tablosu tamam.");

  // 2. USERS Tablosunu Kur
  db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `);
  console.log("✅ Users tablosu tamam.");

  console.log("🎉 KURULUM BAŞARILI!");
  db.close();
} catch (error) {
  console.error("❌ Hata:", error);
}