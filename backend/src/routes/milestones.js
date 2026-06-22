const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

router.get('/projeto/:projectId', authMiddleware, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { proposals: { where: { status: 'accepted' } } }
    });

    if (!project) return res.status(404).json({ message: 'Projeto não encontrado.' });

    const isClient = project.clientId === req.userId;
    const isFreelancer = project.proposals.some(p => p.freelancerId === req.userId);

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' }
    });

    return res.json(milestones);
  } catch (error) { next(error); }
});

router.patch('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const milestoneId = Number(req.params.id);
    const { status } = req.body;

    const validStatus = ['pending', 'in_progress', 'review', 'done'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          include: { proposals: { where: { status: 'accepted' } } }
        }
      }
    });

    if (!milestone) return res.status(404).json({ message: 'Marco não encontrado.' });

    const isClient = milestone.project.clientId === req.userId;
    const isFreelancer = milestone.project.proposals.some(
      p => p.freelancerId === req.userId
    );

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    if (isClient) {
      if (milestone.status !== 'review') {
        return res.status(400).json({ message: 'Você só pode agir em marcos em revisão.' });
      }
      if (!['in_progress', 'done'].includes(status)) {
        return res.status(400).json({ message: 'Ação inválida para o cliente.' });
      }
    }

    if (isFreelancer) {
      if (status === 'done') {
        return res.status(403).json({ message: 'Apenas o cliente pode aprovar a conclusão.' });
      }
    }

    const updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data: { status }
    });

    return res.json(updated);
  } catch (error) { next(error); }
});

module.exports = router;