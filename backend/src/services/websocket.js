const { WebSocketServer } = require('ws');

// Mapa para rastrear os usuários online { userId: socket }
const connectedUsers = new Map();

const initWebSocket = (server, prisma) => {
  const wss = new WebSocketServer({ noServer: true });

  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('connection', (ws, request) => {
    const params = new URLSearchParams(request.url.split('?')[1] || '');
    const userId = Number(params.get('userId'));
    
    if (!userId) {
      ws.close();
      return;
    }

    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    
    connectedUsers.set(userId, ws);

    ws.on('message', async (message) => {
      try {
        const payload = JSON.parse(message.toString());
        if (payload.type !== 'message') return;

        const { fromId, toId, senderName, text } = payload;
        if (!fromId || !toId || !text) return;

        const savedMessage = await prisma.chatMessage.create({
          data: {
            fromUserId: Number(fromId),
            toUserId: Number(toId),
            senderName: senderName || 'Usuário',
            text: text
          }
        });

        const partnerSocket = connectedUsers.get(Number(toId));
        if (partnerSocket && partnerSocket.readyState === ws.OPEN) {
          partnerSocket.send(JSON.stringify({ type: 'message', message: savedMessage }));
        }

        ws.send(JSON.stringify({ type: 'message', message: savedMessage }));

      } catch (error) {
        console.error('❌ Erro no processamento do WebSocket Message:', error.message);
      }
    });

    ws.on('close', () => {
      connectedUsers.delete(userId);
    });
  });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    
    if (url.pathname === '/chat') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });
};

module.exports = { initWebSocket };