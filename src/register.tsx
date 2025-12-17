// frontend/src/Register.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert("Kayıt Başarılı! Şimdi giriş yapabilirsiniz.");
        navigate("/login"); // Kayıt olunca Login sayfasına at
      } else {
        alert("Hata: " + data.message);
      }
    } catch (error) {
      alert("Sunucu hatası");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '30px', border: '1px solid #ccc', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', color: '#333' }}>Yeni Hesap Oluştur</h2>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
          <input 
            type="text" 
            placeholder="Kullanıcı Adı Seçin" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
          <input 
            type="password" 
            placeholder="Şifre Belirleyin" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
          <button type="submit" style={{ padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Kayıt Ol
          </button>
        </form>
        <p style={{textAlign: 'center', marginTop: '15px'}}>
            Zaten hesabın var mı? <a href="/login" style={{color: 'blue'}}>Giriş Yap</a>
        </p>
      </div>
    </div>
  );
}