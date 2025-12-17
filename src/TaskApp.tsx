import { useEffect, useState } from "react";
import { type Priority, type TaskStatus } from "./taskReducer";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000/api";
const WS_URL = "ws://localhost:8000/ws";

type TaskRow = { id: number; title: string; status: any; priority: any; };
const STATUSES: TaskStatus[] = ["todo", "in_progress", "done", "blocked", "archived"];

const getLocalToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");

export default function TaskApp({ token }: { token: string }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  
  // 👇 YENİ STATE'LER (Sayfalama için)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filter, setFilter] = useState<any>("all");
  const [q, setQ] = useState("");
  const [isNewOpen, setNewOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [draftTitle, setDraftTitle] = useState("");
  const [draftPriority, setDraftPriority] = useState<Priority>("medium");
  const [draftStatus, setDraftStatus] = useState<TaskStatus>("todo");

  // WebSocket
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "REFRESH") reload(); 
    };
    return () => ws.close();
  }, [page]); // Sayfa değişince de tetiklensin

  const handleLogout = async () => {
    const currentToken = getLocalToken();
    if (currentToken) {
      await fetch("http://localhost:8000/auth/logout", { 
        method: "POST", 
        headers: { "Authorization": `Bearer ${currentToken}` } 
      }).catch(()=>{});
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  };

  async function tryRefreshToken() {
    const rToken = getRefreshToken();
    if (!rToken) return false;
    try {
      const res = await fetch("http://localhost:8000/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rToken })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("accessToken", data.accessToken);
        return data.accessToken;
      }
    } catch (e) {}
    return false;
  }

  async function authorizedFetch(url: string, options: any = {}) {
    let currentToken = getLocalToken();
    let res = await fetch(url, {
      ...options,
      headers: { ...options.headers, "Content-Type": "application/json", "Authorization": `Bearer ${currentToken}` }
    });

    if (res.status === 401) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        res = await fetch(url, {
          ...options,
          headers: { ...options.headers, "Content-Type": "application/json", "Authorization": `Bearer ${newToken}` }
        });
      } else {
        handleLogout();
        throw new Error("Session expired");
      }
    }
    return res;
  }

  // 👇 GÜNCELLENEN RELOAD FONKSİYONU
  async function reload() {
    // URL'e sayfa ve limit bilgisini ekliyoruz
    const url = `${API}/tasks?page=${page}&limit=5&q=${encodeURIComponent(q)}`;
    try {
      const res = await authorizedFetch(url);
      if (res.ok) {
        const json = await res.json();
        
        // Backend artık { data: [], total: 10 ... } dönüyor
        if (Array.isArray(json)) {
            // Eski format gelirse (Cache vs) patlamasın
            setTasks(json);
        } else {
            // Yeni format
            setTasks(json.data);
            setTotalPages(json.totalPages);
        }
      }
    } catch (err) {}
  }

  // Arama veya Sayfa değişince yenile
  useEffect(() => { reload(); }, [q, page]);

  async function apiCall(method: string, path: string, body?: any) {
    await authorizedFetch(`${API}${path}`, { method, body: JSON.stringify(body) });
    reload(); 
  }

  // --- HTML KISIMLARI ---
  const addFromModal = async () => { 
    if (!draftTitle.trim()) return; 
    await apiCall("POST", "/tasks", { title: draftTitle, priority: draftPriority, status: draftStatus }); 
    setDraftTitle(""); 
    setNewOpen(false); 
  };
  
  const saveEdit = async (fields: any) => { if (!editId) return; await apiCall("PUT", `/tasks/${editId}`, fields); setEditId(null); };
  const apiDelete = async (id: number) => apiCall("DELETE", `/tasks/${id}`);

  // Filtreleme artık backend'de yapılıyor ama görsel filtre için yine de tutabiliriz
  const visible = filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  
  const counts = { all: tasks.length, byStatus: { todo: 0, in_progress: 0, done: 0, blocked: 0, archived: 0 } } as any;
  for (const t of tasks) if(counts.byStatus[t.status] !== undefined) counts.byStatus[t.status]++;

  return (
    <div style={{ display: "flex", fontFamily: "sans-serif", minHeight: "100vh" }}>
      <Sidebar active={filter} counts={counts} onPick={setFilter} onNew={() => setNewOpen(true)} onClearDone={() => {}} />
      <main style={{ flex: 1, padding: 20, maxWidth: 800, margin: "0 auto" }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h2>Task Manager</h2>
            <button onClick={handleLogout} style={{background:'#dc3545', color:'white', border:'none', padding:'8px 16px', borderRadius:4, cursor:'pointer'}}>Logout</button>
        </div>
        
        <div style={{marginTop: 10, display:'flex', gap: 10}}>
            <input value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} placeholder="Ara..." style={{padding:8, flex:1}} />
            <button onClick={()=>setNewOpen(true)} style={{background: '#28a745', color:'white', border:'none', borderRadius:4}}>+ Yeni Ekle</button>
        </div>

        <ul style={{listStyle:'none', padding:0, marginTop:20}}>
            {visible.map(t => (
                <li key={t.id} style={{display:'grid', gridTemplateColumns:'1fr auto auto auto auto', gap:10, padding:10, borderBottom:'1px solid #eee', alignItems:'center'}}>
                    <span>{t.title}</span>
                    <select value={t.status} onChange={e => apiCall("PUT", `/tasks/${t.id}`, {status: e.target.value})}> {STATUSES.map(s=><option key={s} value={s}>{s}</option>)} </select>
                    <button onClick={()=>setEditId(t.id)}>✎</button>
                    <button onClick={()=>apiDelete(t.id)}>✕</button>
                </li>
            ))}
            {tasks.length === 0 && <p style={{color:'#999', textAlign:'center'}}>Bu sayfada görev yok.</p>}
        </ul>

        {/* 👇 YENİ EKLENEN PAGINATION BUTONLARI */}
        <div style={{display:'flex', justifyContent:'center', gap: 10, marginTop: 20, alignItems:'center'}}>
            <button 
                disabled={page <= 1} 
                onClick={() => setPage(p => p - 1)}
                style={{padding:'5px 15px', cursor: page<=1 ? 'not-allowed' : 'pointer', opacity: page<=1 ? 0.5 : 1}}
            >
                &laquo; Önceki
            </button>
            <span>Sayfa {page} / {totalPages || 1}</span>
            <button 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => p + 1)}
                style={{padding:'5px 15px', cursor: page>=totalPages ? 'not-allowed' : 'pointer', opacity: page>=totalPages ? 0.5 : 1}}
            >
                Sonraki &raquo;
            </button>
        </div>
        {/* ------------------------------------- */}

      </main>
      
      {isNewOpen && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <div style={{background:'white', padding:20, borderRadius:8, minWidth:300}}>
                <h3>Yeni Görev</h3>
                <input autoFocus value={draftTitle} onChange={e=>setDraftTitle(e.target.value)} placeholder="Başlık" style={{width:'100%', marginBottom:10, padding:8}} />
                <div style={{marginBottom: 10}}>
                   <select value={draftPriority} onChange={e=>setDraftPriority(e.target.value as any)}>
                     <option value="low">Düşük</option>
                     <option value="medium">Orta</option>
                     <option value="high">Yüksek</option>
                   </select>
                </div>
                <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
                    <button onClick={()=>setNewOpen(false)}>İptal</button>
                    <button onClick={addFromModal} style={{background:'blue', color:'white'}}>Ekle</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}