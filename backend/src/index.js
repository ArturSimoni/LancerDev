require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects'); 
const proposalRoutes = require('./routes/proposals');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/propostas', proposalRoutes);

const io = new Server(server, { cors: { origin: 'http://localhost:5173' } });

io.on('connection', (socket) => {
  console.log(`⚡ Usuário conectado: ${socket.id}`);
  socket.on('join_room', (data) => socket.join(`room_${data.roomId}`));
  socket.on('send_message', (data) => {
    socket.to(`room_${data.roomId}`).emit('receive_message', {
      id: Date.now(),
      text: data.text,
      senderId: data.senderId,
      createdAt: new Date()
    });
  });
  socket.on('disconnect', () => console.log(`❌ Usuário desconectou: ${socket.id}`));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));