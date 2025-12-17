// backend/services/bloom.ts

export class BloomFilter {
  private size: number;
  private bitArray: Uint8Array;

  constructor(size: number = 1024) {
    this.size = size;
    this.bitArray = new Uint8Array(size);
  }

  // Basit ve hızlı bir hash fonksiyonu (FNV-1a algoritması benzeri)
  private hash(value: string, seed: number): number {
    let hash = seed;
    for (let i = 0; i < value.length; i++) {
      hash = (hash ^ value.charCodeAt(i)) * 16777619;
    }
    return (hash >>> 0) % this.size;
  }

  // Token'ı Ekle (3 farklı hash ile işaretle)
  add(value: string) {
    const h1 = this.hash(value, 0x811c9dc5);
    const h2 = this.hash(value, 0x9747b28c);
    const h3 = this.hash(value, 0x36219371);

    this.bitArray[h1] = 1;
    this.bitArray[h2] = 1;
    this.bitArray[h3] = 1;
  }

  // Token Yasaklı mı?
  has(value: string): boolean {
    const h1 = this.hash(value, 0x811c9dc5);
    const h2 = this.hash(value, 0x9747b28c);
    const h3 = this.hash(value, 0x36219371);

    // Eğer 3 noktada da işaret varsa, bu token yasaklıdır!
    return !!(this.bitArray[h1] && this.bitArray[h2] && this.bitArray[h3]);
  }
}

// Servisi dışarı açıyoruz
export const blacklistFilter = new BloomFilter(10000); // 10 binlik kapasite