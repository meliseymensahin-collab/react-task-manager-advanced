import { Application, Router } from "@oak/oak";
import { oakCors } from "@oak/cors";
import { create } from "@zaubrik/djwt";
import { users } from "./users.ts"; // users.ts dosyan olduğundan emin ol

const app = new Application();
const router = new Router();

const SECRET_KEY = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"]
);

app.use(oakCors({ origin: "http://localhost:5173" }));

// --- ROTALAR (Bunlar app.use'dan ÖNCE tanımlanmalı) ---

// 1. Ana Sayfa
router.get("/", (ctx) => {
  ctx.response.body = { status: "OK", message: "Backend çalışıyor!" };
});

// 2. Login
router.post("/auth/login", async (ctx) => {
  try {
    const body = await ctx.request.body.json();
    const { username, password } = body;
    const user = users.get(username);

    if (!user || user.passwordHash !== password) {
      ctx.response.status = 401;
      ctx.response.body = { message: "Hatalı giriş!" };
      return;
    }

    const jwt = await create({ alg: "HS512", type: "JWT" }, { username: user.username, id: user.id }, SECRET_KEY);

    ctx.response.body = { message: "Giriş Başarılı", token: jwt, username: user.username };
  } catch (err) {
    ctx.response.status = 400;
    ctx.response.body = { message: "Hata oluştu" };
  }
});

// 3. Register
router.post("/auth/register", async (ctx) => {
  try {
    const body = await ctx.request.body.json();
    const { username, password } = body;
    
    if (users.has(username)) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Kullanıcı zaten var!" };
      return;
    }

    users.set(username, { id: crypto.randomUUID(), username, passwordHash: password });
    ctx.response.body = { message: "Kayıt oluşturuldu!" };
  } catch (err) {
    ctx.response.status = 400;
    ctx.response.body = { message: "Hata oluştu" };
  }
});

// --- ROTALARI AKTİF ET (EN SONDA OLMALI) ---
app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server çalışıyor: http://localhost:8000");
await app.listen({ port: 8000 });