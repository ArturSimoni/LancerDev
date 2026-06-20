const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { projectId, totalAmount, coverText, milestones } = req.body;
    if (!projectId || !totalAmount) {
      return res.status(400).json({ message: 'Informações essenciais ausentes.' });
    }
    const proposal = await prisma.proposal.create({
      data: {
        projectId: Number(projectId),
        freelancerId: req.userId,
        amount: Number(totalAmount),
        coverText: coverText || null,
        status: 'pending',
      }
    });
    return res.status(201).json({
      message: 'Proposta enviada!',
      proposal: { ...proposal, milestones: milestones || [] }
    });
  } catch (error) { next(error); }
});

router.get('/projeto/:projectId', authMiddleware, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) return res.status(404).json({ message: 'Projeto não existe.' });
    if (project.clientId !== req.userId) return res.status(403).json({ message: 'Ação não autorizada.' });

    const proposals = await prisma.proposal.findMany({
      where: { projectId },
      include: { freelancer: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(proposals);
  } catch (error) { next(error); }
});

router.get('/minhas', authMiddleware, async (req, res, next) => {
  try {
    const proposals = await prisma.proposal.findMany({
      where: { freelancerId: req.userId },
      include: { project: { select: { title: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(proposals);
  } catch (error) { next(error); }
});

router.post('/:id/accept', authMiddleware, async (req, res, next) => {
  try {
    const proposalId = Number(req.params.id);
    const milestones = req.body?.milestones || [];

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { project: true }
    });

    if (!proposal) return res.status(404).json({ message: 'Proposta não encontrada.' });
    if (proposal.project.clientId !== req.userId) return res.status(403).json({ message: 'Ação não autorizada.' });
    if (proposal.project.status !== 'open') return res.status(400).json({ message: 'Este projeto já possui contrato fechado.' });

    await prisma.$transaction(async (tx) => {
      // 1. Aceita esta proposta
      await tx.proposal.update({
        where: { id: proposalId },
        data: { status: 'accepted' }
      });

      await tx.proposal.updateMany({
        where: { projectId: proposal.projectId, id: { not: proposalId } },
        data: { status: 'rejected' }
      });

      await tx.project.update({
        where: { id: proposal.projectId },
        data: { status: 'in_progress' }
      });

      if (milestones.length > 0) {
        await tx.milestone.createMany({
          data: milestones.map(m => ({
            projectId: proposal.projectId,
            title: m.title,
            description: m.description || '',
            amount: Number(m.amount),
            status: 'pending'
          }))
        });
      }

      // 5. Cria a sala de chat entre cliente e freelancer
      await tx.chat.create({
        data: {
          projectId: proposal.projectId,
          clientId: req.userId,
          freelancerId: proposal.freelancerId
        }
      });
    });

    return res.json({ message: 'Contrato fechado! Kanban e chat liberados.' });
  } catch (error) { next(error); }
});

module.exports = router;