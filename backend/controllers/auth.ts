import { Context } from "npm:hono";
import { orm } from "../db/drizzle.ts";
import { users } from "../db/schema.ts";
import { eq } from "npm:drizzle-orm";
import { sign, verify } from "npm:hono/jwt"; // 👈 'verify' eklendi
import { blacklist } from "../services/blacklist.ts";
import { saveDb } from "../db/connection.ts"; 

const JWT_SECRET = "gizli_anahtar_buraya"; 

// 1. REGISTER (Kayıt Ol)
export const register = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    if (!username || !password) {
      return c.json({ error: "Kullanıcı adı ve şifre zorunlu!" }, 400);
    }

    const existing = await orm.select().from(users).where(eq(users.username, username)).get();
    
    if (existing) {
      return c.json({ error: "Bu kullanıcı adı zaten alınmış." }, 409);
    }

    await orm.insert(users).values({ username, password });
    await saveDb(); 

    return c.json({ message: "Kayıt başarılı! Şimdi giriş yapabilirsiniz." }, 201);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Kayıt sırasında hata oluştu." }, 500);
  }
};

// 2. LOGIN (Giriş Yap)
export const login = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    const user = await orm.select().from(users).where(eq(users.username, username)).get();

    if (!user || user.password !== password) {
      return c.json({ error: "Hatalı kullanıcı adı veya şifre!" }, 401);
    }

    const now = Math.floor(Date.now() / 1000);

    // Kısa ömürlü (1 Saat)
    const accessToken = await sign({
      id: user.id,
      username: user.username,
      exp: now + 60 * 60, 
    }, JWT_SECRET);

    // Uzun ömürlü (7 Gün)
    const refreshToken = await sign({
      id: user.id,
      username: user.username,
      exp: now + 7 * 24 * 60 * 60, 
    }, JWT_SECRET);

    return c.json({ 
      message: "Giriş Başarılı",
      accessToken, 
      refreshToken,
      username: user.username 
    });

  } catch (e) {
    console.error(e);
    return c.json({ error: "Giriş sırasında hata oluştu." }, 500);
  }
};

// 3. LOGOUT
export const logout = async (c: Context) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    blacklist.add(token);
  }
  return c.json({ message: "Çıkış yapıldı." });
};

// 👇 4. REFRESH (YENİ EKLENEN KISIM)
// Bu fonksiyon, elinde geçerli bir Refresh Token olan kişiye yeni Access Token verir.
export const refresh = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return c.json({ error: "Refresh token gerekli!" }, 400);
    }

    // Token geçerli mi diye kontrol et (imza kontrolü)
    // Eğer süresi dolmuşsa veya sahteyse verify hata fırlatır.
    const payload = await verify(refreshToken, JWT_SECRET);

    // Geçerliyse yeni bir Access Token üret
    const now = Math.floor(Date.now() / 1000);
    const newAccessToken = await sign({
      id: payload.id,
      username: payload.username,
      exp: now + 60 * 60, // 1 saatlik yeni token
    }, JWT_SECRET);

    return c.json({ accessToken: newAccessToken });

  } catch (e) {
    return c.json({ error: "Geçersiz veya süresi dolmuş Refresh Token" }, 401);
  }
};