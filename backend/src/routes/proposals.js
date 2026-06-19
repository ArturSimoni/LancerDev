const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

// Criar proposta
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { projectId, totalAmount, coverText } = req.body;
    if (!projectId || !totalAmount) {
      return res.status(400).json({ message: 'Informações essenciais ausentes.' });
    }
    const proposal = await prisma.proposal.create({
      data: {
        projectId: Number(projectId),
        freelancerId: req.userId,
        amount: Number(totalAmount),
        coverText: coverText || null,
        status: 'pending'
      }
    });
    return res.status(201).json({ message: 'Proposta enviada!', proposal });
  } catch (error) { next(error); }
});

// Listar minhas propostas
router.get('/minhas', authMiddleware, async (req, res, next) => {
  try {
    const proposals = await prisma.proposal.findMany({
      where: { freelancerId: req.userId },
      include: { 
        project: { select: { title: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(proposals);
  } catch (error) { next(error); }
});

module.exports = router;