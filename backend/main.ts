// @ts-nocheck
import { swaggerUI } from "npm:@hono/swagger-ui";
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { login, logout, register, refresh } from "./controllers/auth.ts";
import { blacklist } from "./services/blacklist.ts";
import { handleWs } from "./services/socket.ts"; 
// 1. DEĞİŞİKLİK: poolManager buraya eklendi
import { orm, poolManager } from "./db/drizzle.ts";
import { saveDb } from "./db/connection.ts";
import { migrate } from "npm:drizzle-orm/sql-js/migrator";
import { logger } from "./middleware/logger.ts";
import { tasksRoute } from "./routes/tasks.ts";
import { DB_URL, PORT } from "./config/env.ts";
import { z } from "npm:zod";
import { OpenAPIHono } from "npm:@hono/zod-openapi";
import { verify } from "npm:hono/jwt"; // 👈 'verify' eklendi

const JWT_SECRET = "gizli_anahtar_buraya";

// Veritabanı taşıma işlemleri
try { await migrate(orm, { migrationsFolder: "./db/migrations" }); } catch (e) {} finally { await saveDb(); }

const app = new OpenAPIHono();

// Middleware'ler (CORS, Logger, Blacklist Kontrolü)
app.use("*", cors({ 
  origin: "*", 
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
  allowHeaders: ["content-type", "authorization"], 
  // Frontend bu başlığı okuyabilsin diye izin veriyoruz
  exposeHeaders: ["location", "X-Connection-Pool-ID"] 
}));

app.use("*", logger);

// 2. DEĞİŞİKLİK: Her cevaba Havuz Kimliğini (Pool ID) basıyoruz
app.use("*", async (c, next) => {
  if (poolManager && poolManager.poolId) {
    c.header("X-Connection-Pool-ID", poolManager.poolId);
  }
  await next();
});

// Token Blacklist Kontrolü (Middleware) & Authentication Check
app.use("/api/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2) {
      const token = parts[1];
      if (blacklist.has(token)) return c.json({ message: "Token Revoked" }, 401);

      try {
        await verify(token, JWT_SECRET);
      } catch (e) {
        return c.json({ message: "Invalid Token" }, 401);
      }
    } else {
        return c.json({ message: "Invalid Authorization Header" }, 401);
    }
  } else {
    // If no authorization header is present for /api/* routes, return 401
    return c.json({ message: "Unauthorized" }, 401);
  }
  await next();
});

tasksRoute.use("*", logger);

// Ana sayfa rotası (404 almamak için)
app.get("/", (c) => c.text("Backend Çalışıyor! 🚀 /api/tasks veya /auth/login kullanabilirsin."));

// AUTH ROTALARI
app.post("/auth/login", login);
app.post("/auth/logout", logout);
app.post("/auth/register", register);
app.post("/auth/refresh", refresh);

// DİĞER ROTALAR
app.route("/api/tasks", tasksRoute);
app.get("/api/hello", (c) => c.json({ msg: "System Online ✅" }));
// Swagger'ın okuyacağı JSON haritası (Bunu eklemezsen Swagger boş görünür)
app.get("/openapi.json", (c) => {
  return c.json({
    openapi: "3.0.0",
    info: {
      title: "Task Manager API",
      version: "1.0.0",
      description: "React & Hono ile geliştirilmiş Gelişmiş Görev Yönetim Sistemi API Dokümantasyonu."
    },
    paths: {
      "/tasks": {
        get: {
          summary: "Tüm Görevleri Listele",
          responses: { "200": { description: "Başarılı" } }
        },
        post: {
          summary: "Yeni Görev Ekle",
          responses: { "201": { description: "Oluşturuldu" } }
        }
      },
      "/auth/login": {
        post: {
          summary: "Kullanıcı Girişi (Login)",
          responses: { "200": { description: "Token döner" } }
        }
      }
    }
  });
});
app.get("/docs", swaggerUI({ url: "/openapi.json" }));

// SUNUCUYU BAŞLATMA
Deno.serve({ port: 8000 }, (req) => {
  if (req.headers.get("upgrade") === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    handleWs(socket);
    return response;
  }
  return app.fetch(req);
});

console.log("🔥 Server running at http://localhost:8000");