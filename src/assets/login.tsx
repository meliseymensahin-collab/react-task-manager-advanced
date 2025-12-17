// frontend/src/Login.tsx
import { useState } from 'react';

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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
        localStorage.setItem("token", data.accessToken);
        window.location.href = "/";
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2>Giriş Yap</h2>
        <input placeholder="Kullanıcı Adı (admin)" value={username} onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="Şifre (123456)" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Giriş</button>
      </form>
    </div>
  );
}