const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

// Lista conversas do usuário logado
router.get('/conversations', authMiddleware, async (req, res, next) => {
  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { clientId: req.userId },
          { freelancerId: req.userId }
        ]
      },
      include: {
        project: { select: { title: true } },
        client: { select: { id: true, name: true } },
        freelancer: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formata para o frontend saber quem é o "outro participante"
    const formatted = chats.map(chat => ({
      id: chat.id,
      project: chat.project,
      otherParticipant:
        chat.clientId === req.userId ? chat.freelancer : chat.client
    }));

    return res.json(formatted);
  } catch (error) { next(error); }
});

// Histórico de mensagens de uma sala
router.get('/messages/:chatId', authMiddleware, async (req, res, next) => {
  try {
    const chatId = Number(req.params.chatId);

    // Verifica se o usuário pertence a essa sala
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [{ clientId: req.userId }, { freelancerId: req.userId }]
      }
    });

    if (!chat) return res.status(403).json({ message: 'Acesso negado.' });

    const messages = await prisma.chatRoomMessage.findMany({
      where: { chatId },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: 'asc' }
    });

    return res.json(messages);
  } catch (error) { next(error); }
});

module.exports = router;