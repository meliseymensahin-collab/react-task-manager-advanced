import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// App.tsx'ten gelen "Giriş Başarılı" fonksiyonunu tanıyoruz
interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // 1. Access Token'ı App.tsx'e gönder (Uygulamayı açar)
        onLoginSuccess(data.accessToken || data.token);

        // --- YENİ EKLENEN KISIM (BONUS İÇİN) ---
        // Eğer backend refresh token gönderdiyse, onu da sakla.
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }
        // ----------------------------------------

        // 2. Sayfayı yenilemeden ana sayfaya yönlendir
        navigate("/");
        
      } else {
        alert("Hata: " + (data.message || "Giriş yapılamadı"));
      }
    } catch (error) {
      alert("Sunucuya bağlanılamadı!");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '30px', border: '1px solid #ccc', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', color: '#333' }}>Giriş Yap</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
          <input 
            type="text" 
            placeholder="Kullanıcı Adı" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
          <input 
            type="password" 
            placeholder="Şifre" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
          <button type="submit" style={{ padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Giriş Yap
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          <p>Hesabın yok mu?</p>
          <button 
            onClick={() => navigate("/register")}
            style={{ background: 'none', border: 'none', color: '#28a745', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
          >
            Buraya tıkla ve Kayıt Ol
          </button> 
        </div>
      </div>
    </div>
  );
}