import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import TaskApp from './TaskApp';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("accessToken"));

  // Token değişince localStorage güncelle
  useEffect(() => {
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken"); // Varsa bunu da sil
    }
  }, [token]);

  // 👇 YENİ EKLENEN KISIM: BAŞKA SEKMEDE ÇIKIŞ YAPILIRSA BUNU YAKALA
  useEffect(() => {
    const syncLogout = (event: StorageEvent) => {
      // Eğer başka bir sekme 'accessToken'ı sildiyse (yani çıkış yaptıysa)
      if (event.key === "accessToken" && event.newValue === null) {
        setToken(null); // Biz de çıkış yapalım
        window.location.href = "/login"; // Login sayfasına atalım
      }
    };

    window.addEventListener("storage", syncLogout);
    return () => window.removeEventListener("storage", syncLogout);
  }, []);
  // ------------------------------------------------------------------

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={<Login onLoginSuccess={(newToken) => setToken(newToken)} />} 
        />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            token ? <TaskApp token={token} /> : <Navigate to="/login" />
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;