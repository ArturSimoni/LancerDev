require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const prisma = require('./config/database');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const proposalRoutes = require('./routes/proposals');
const chatRoutes = require('./routes/chats');
const milestoneRoutes = require('./routes/milestones');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/propostas', proposalRoutes);
app.use('/chats', chatRoutes);
app.use('/milestones', milestoneRoutes);

const io = new Server(server, { cors: { origin: 'http://localhost:5173' } });

io.on('connection', (socket) => {
  console.log(`⚡ Conectado: ${socket.id}`);

  socket.on('join_room', (data) => {
    socket.join(`room_${data.roomId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const saved = await prisma.chatRoomMessage.create({
        data: {
          chatId: Number(data.roomId),
          senderId: Number(data.senderId),
          text: data.text
        }
      });
      io.to(`room_${data.roomId}`).emit('receive_message', {
        id: saved.id,
        chatId: saved.chatId,
        senderId: saved.senderId,
        text: saved.text,
        createdAt: saved.createdAt
      });
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  });

  socket.on('disconnect', () => console.log(`❌ Desconectado: ${socket.id}`));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));