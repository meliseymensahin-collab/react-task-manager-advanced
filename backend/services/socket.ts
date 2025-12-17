// backend/services/socket.ts
const clients = new Set<WebSocket>();

export const handleWs = (socket: WebSocket) => {
  socket.onopen = () => {
    // Sadece bağlandığında bilgi versin
    // console.log("🔌 Yeni kullanıcı"); // İstersen bunu da yorum satırı yapıp sessize alabilirsin
    clients.add(socket);
  };

  socket.onclose = () => {
    clients.delete(socket);
  };

  socket.onerror = (e) => {
    // BURAYI DEĞİŞTİRDİK:
    // Artık hatayı ekrana kırmızı kırmızı basmayacak.
    // Sadece sessizce bağlantıyı silecek.
    clients.delete(socket);
  };
};

export const broadcastRefresh = () => {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "REFRESH" }));
    }
  }
};