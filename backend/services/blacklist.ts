// backend/services/blacklist.ts
import { blacklistFilter } from "./bloom.ts";

// Artık Bloom Filter kullanıyoruz!
// Bloom Filter'lar "False Positive" (Yanlış Alarm) verebilir ama "False Negative" vermez.
// Yani "Yasaklı değil" diyorsa KESİN yasaklı değildir.

export const blacklist = {
  add(token: string) {
    blacklistFilter.add(token);
    console.log("🚫 Token Bloom Filter'a eklendi (Hafıza dostu!)");
  },

  has(token: string): boolean {
    return blacklistFilter.has(token);
  }
};