const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const userId = Number(req.userId);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.notification.count({
        where: {
          userId,
          read: false
        }
      })
    ]);

    return res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    const userId = Number(req.userId);

    await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true
      }
    });

    return res.json({
      message: 'Todas as notificações foram marcadas como lidas.'
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const userId = Number(req.userId);
    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({
        message: 'Notificação inválida.'
      });
    }

    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        read: true
      }
    });

    if (result.count === 0) {
      return res.status(404).json({
        message: 'Notificação não encontrada.'
      });
    }

    return res.json({
      message: 'Notificação marcada como lida.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;