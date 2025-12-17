import { Hono } from "npm:hono";
import { eq, desc, like, sql } from "npm:drizzle-orm";
import { orm } from "../db/drizzle.ts";
import { tasks } from "../db/schema.ts";
import { saveDb } from "../db/connection.ts";
import { broadcastRefresh } from "../services/socket.ts";

export const tasksRoute = new Hono();
const kv = await Deno.openKv();
const CACHE_KEY = ["tasks_all"];

// 1. GET (SAYFALAMA DESTEKLİ)
tasksRoute.get("/", async (c) => {
    const q = (c.req.query("q") ?? "").toLowerCase();
    const page = Number(c.req.query("page") || 1); // Sayfa no (Varsayılan 1)
    const limit = Number(c.req.query("limit") || 5); // Sayfa başına görev (Varsayılan 5)
    const offset = (page - 1) * limit;

    // Cache olayını şimdilik sadece arama yoksa ve ilk sayfa ise kullanalım
    // (Detaylı cache mantığı karışık olur, basit tutalım)
    if (!q && page === 1) {
        const cached = await kv.get(CACHE_KEY);
        if (cached.value) {
            console.log("⚡ CACHE HIT! (Hızlı Cevap)");
            // Cache'den döneni de yeni formata uyduralım
            return c.json({ data: cached.value, total: cached.value.length, page: 1, cached: true });
        }
    }

    console.log("🐢 Veritabanından çekiliyor (Sayfa: " + page + ")");
    
    // Sorguyu hazırla
    let query = orm.select().from(tasks).orderBy(desc(tasks.id));
    
    // Filtreleme (Arama varsa)
    let allRows = await query.all();
    if (q) {
        allRows = allRows.filter((r) => r.title.toLowerCase().includes(q));
    }

    // Toplam sayı (Frontend bilsin ki 'İleri' butonu koysun)
    const total = allRows.length;

    // Sayfalama (Dilimleme) işlemi
    const paginatedRows = allRows.slice(offset, offset + limit);

    // Cache'e sadece "Hepsini" kaydetmek mantıklı (yukarıdaki cache mantığı için)
    // Ama şimdilik cache'i sadece 1. sayfa için güncelleyelim
    if (!q && page === 1) await kv.set(CACHE_KEY, paginatedRows);

    // YENİ CEVAP FORMATI:
    return c.json({
        data: paginatedRows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    });
});

// ... (POST, PUT, DELETE AYNI KALACAK) ...
// (Kolaylık olsun diye aşağısı senin kodunun aynısı)

tasksRoute.post("/", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const title = String(body.title ?? "").trim();
    if (!title) return c.json({ error: "title required" }, 400);

    const inserted = await orm.insert(tasks).values({ title, priority: body.priority ?? "medium", status: body.status ?? "todo", module: body.module ?? null }).returning().get();
    await saveDb();
    await kv.delete(CACHE_KEY); 
    broadcastRefresh(); 
    return c.json(inserted, 201);
});

tasksRoute.put("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const patch = await c.req.json().catch(() => ({}));
    const { id: _ignore, ...safePatch } = patch;
    await orm.update(tasks).set(safePatch).where(eq(tasks.id, id)).run();
    const updated = await orm.select().from(tasks).where(eq(tasks.id, id)).get();
    await saveDb();
    await kv.delete(CACHE_KEY);
    broadcastRefresh();
    if (!updated) return c.json({ error: "not found" }, 404);
    return c.json(updated);
});

tasksRoute.delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    await orm.delete(tasks).where(eq(tasks.id, id)).run();
    await saveDb();
    await kv.delete(CACHE_KEY);
    broadcastRefresh();
    return c.json({ ok: true });
});