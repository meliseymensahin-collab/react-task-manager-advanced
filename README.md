# React Task Manager 

Bu proje, modern web teknolojileri kullanılarak geliştirilmiş, **Stateless (Durumsuz)** mimariye sahip, yüksek performanslı ve ölçeklenebilir bir Görev Yönetim Sistemidir.

---

## Teknik Özellikler ve Uygulama Detayları (Bonuslar)

Projede uygulanan teknikler, nasıl yapıldıkları ve doğrulama yöntemleri aşağıda detaylandırılmıştır:

### 1. JWT Authentication & Stateless Security
* **Ne Yapıldı:** Kullanıcı güvenliği için Access Token (1 saat) ve Refresh Token (7 gün) yapısı kuruldu.
* **Nasıl Uygulandı:** Refresh token'lar veritabanına kaydedilmedi **(-1 ceza maddesine uygun olarak)**. Bunun yerine, token geçerliliği kriptografik imza (`jwt.verify`) ile doğrulandı.
* **Doğrulama:** `backend/controllers/auth.ts` dosyasında hiçbir veritabanı sorgusu (`db.insert/select`) yapılmadığı, işlemin tamamen CPU üzerinde imza kontrolüyle gerçekleştiği görülebilir.

### 2. Logout & Bloom Filter (Blacklist)
* **Ne Yapıldı:** Stateless yapıda sunucu tarafında oturum kapatma (Logout) mekanizması geliştirildi.
* **Nasıl Uygulandı:** Çıkış yapan kullanıcıların token'ları veritabanını şişirmemek için bellekte çalışan **Bloom Filter** algoritmasına (Blacklist) işlendi.
* **Doğrulama:** Çıkış yapıldıktan sonra eski token ile istek atıldığında sunucu `401 Token Revoked` yanıtı dönmektedir.

### 3. Caching & Performance (Deno KV)
* **Ne Yapıldı:** Veritabanı yükünü azaltmak ve yanıt sürelerini milisaniyeler seviyesine indirmek için önbellekleme (Caching) yapıldı.
* **Nasıl Uygulandı:** Redis mantığıyla çalışan **Deno KV** kullanıldı. Görev listesi ilk istekte veritabanından çekilip Cache'e yazılıyor.
* **Doğrulama:** Terminal loglarında ilk istekte `CACHE MISS`, ikinci istekte `CACHE HIT` yazdığı ve sürenin kısaldığı gözlemlenebilir.

### 4. Real-Time Updates (WebSocket)
* **Ne Yapıldı:** Sayfa yenilemeye gerek kalmadan tüm kullanıcılarda anlık veri güncellemeleri sağlandı.
* **Nasıl Uygulandı:** Backend üzerinde WebSocket sunucusu açıldı. Bir kullanıcı görev eklediğinde veya sildiğinde, bağlı tüm istemcilere (Clients) "REFRESH" sinyali gönderiliyor.
* **Doğrulama:** İki farklı tarayıcı sekmesinde, birinde yapılan değişikliğin diğerine anında yansıdığı test edilmiştir.

### 5. Connection Pooling (Singleton Pattern)
* **Ne Yapıldı:** SQLite veritabanının kilitlenmesini (Database Locked) önlemek için bağlantı havuzu yönetimi yapıldı.
* **Nasıl Uygulandı:** `backend/db/drizzle.ts` dosyasında Singleton Pattern kullanılarak tüm uygulamanın tek bir veritabanı bağlantısı üzerinden konuşması sağlandı (`WAL Mode` aktif edildi).
* **Doğrulama:** Tarayıcı Ağ (Network) sekmesinde gelen yanıtlarda `X-Connection-Pool-ID` başlığının (Header) sabit kaldığı görülebilir.

### 6. API Documentation (Swagger UI)
* **Ne Yapıldı:** API uçlarının (Endpoints) kullanımını gösteren interaktif dokümantasyon hazırlandı.
* **Nasıl Uygulandı:** `@hono/swagger-ui` kütüphanesi entegre edildi ve `openapi.json` şeması oluşturuldu.
* **Erişim:** `/docs` rotasında çalışmaktadır.

---




