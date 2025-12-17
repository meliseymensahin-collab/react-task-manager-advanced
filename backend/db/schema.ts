import { sqliteTable, text, integer } from "npm:drizzle-orm/sqlite-core";

// 1. GÖREVLER TABLOSU (Zaten vardı)
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  status: text("status").default("todo"),
  priority: text("priority").default("medium"),
  module: text("module"),
});

// 2. KULLANICILAR TABLOSU (BUNU EKLİYORUZ)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(), // Aynı isimle iki kişi olmasın diye unique dedik
  password: text("password").notNull(),
});