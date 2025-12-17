// backend/services/cache.ts

// Deno'nun yerleşik Key-Value veritabanını açıyoruz
const kv = await Deno.openKv();

export const cacheService = {
  // 1. Veriyi Cache'e Yaz (Varsayılan 60 saniye sakla)
  async set(key: string, value: any, ttlSeconds: number = 60) {
    await kv.set(["cache", key], value, { expireIn: ttlSeconds * 1000 });
  },

  // 2. Veriyi Cache'den Oku
  async get(key: string) {
    const result = await kv.get(["cache", key]);
    return result.value;
  },

  // 3. Cache'i Temizle (Yeni veri eklendiğinde bunu çağıracağız)
  async delete(key: string) {
    await kv.delete(["cache", key]);
  },
  
  // 4. Tüm Listeyi Temizle (Wildcard)
  // Görev ekleyince "tüm görev listesi" önbelleğini silmek için
  async invalidateTasks() {
    // Basitlik olsun diye "tasks_all" ve "tasks_search" gibi anahtarları siliyoruz
    // Gerçek bir Redis'te pattern matching olurdu ama KV'de manuel siliyoruz.
    await kv.delete(["cache", "tasks_list"]);
  }
};