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
const profileRoutes = require('./routes/profile');
const paymentsRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const reviewRoutes = require('./routes/reviews');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/propostas', proposalRoutes);
app.use('/chats', chatRoutes);
app.use('/milestones', milestoneRoutes);
app.use('/perfil', profileRoutes);
app.use('/payments', paymentsRoutes);
app.use('/notifications', notificationRoutes);
app.use('/reviews', reviewRoutes);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173'
  }
});

io.on('connection', (socket) => {
  console.log(`Conectado: ${socket.id}`);

  socket.on('join_room', async (data) => {
    try {
      const roomId = Number(data?.roomId);
      const userId = Number(data?.userId);

      if (
        !Number.isInteger(roomId) ||
        roomId <= 0 ||
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        return;
      }

      const chat = await prisma.chat.findFirst({
        where: {
          id: roomId,
          OR: [
            { clientId: userId },
            { freelancerId: userId }
          ]
        },
        select: {
          id: true
        }
      });

      if (!chat) {
        return;
      }

      socket.join(`room_${roomId}`);
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const roomId = Number(data?.roomId);
      const senderId = Number(data?.senderId);
      const messageText = String(data?.text || '').trim();

      if (
        !Number.isInteger(roomId) ||
        roomId <= 0 ||
        !Number.isInteger(senderId) ||
        senderId <= 0 ||
        !messageText
      ) {
        return;
      }

      const chat = await prisma.chat.findFirst({
        where: {
          id: roomId,
          OR: [
            { clientId: senderId },
            { freelancerId: senderId }
          ]
        },
        include: {
          project: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      if (!chat) {
        return;
      }

      const saved = await prisma.chatRoomMessage.create({
        data: {
          chatId: roomId,
          senderId,
          text: messageText
        }
      });

      io.to(`room_${roomId}`).emit('receive_message', {
        id: saved.id,
        chatId: saved.chatId,
        senderId: saved.senderId,
        text: saved.text,
        createdAt: saved.createdAt
      });

      const recipientId =
        Number(chat.clientId) === senderId
          ? Number(chat.freelancerId)
          : Number(chat.clientId);

      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: {
          name: true
        }
      });

      await prisma.notification.create({
        data: {
          userId: recipientId,
          projectId: chat.project.id,
          type: 'new_message',
          message: `${sender?.name || 'Você recebeu'} enviou uma mensagem no projeto "${chat.project.title}".`
        }
      });
    } catch (error) {
      console.error('Erro ao salvar mensagem ou criar notificação:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});