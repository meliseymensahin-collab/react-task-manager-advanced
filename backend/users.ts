export interface User {
  id: string;
  username: string;
  passwordHash: string;
}

// Kullanıcıları hafızada tutmak için (Veritabanı yerine)
export const users = new Map<string, User>();

// Test için hazır bir kullanıcı (Kullanıcı adı: admin, Şifre: 123)
users.set("admin", {
  id: "1",
  username: "admin",
  passwordHash: "123"
});