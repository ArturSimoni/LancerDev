const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { projectId, totalAmount, coverText, milestones } = req.body;

    if (!projectId || !totalAmount) {
      return res.status(400).json({
        message: 'Informações essenciais ausentes.'
      });
    }

    const numericProjectId = Number(projectId);
    const amount = Number(totalAmount);

    if (!Number.isInteger(numericProjectId) || numericProjectId <= 0) {
      return res.status(400).json({
        message: 'Projeto inválido.'
      });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: 'Valor da proposta inválido.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(req.userId) },
      select: {
        id: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado.'
      });
    }

    if (user.role !== 'freelancer') {
      return res.status(403).json({
        message: 'Apenas freelancers podem enviar propostas.'
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: numericProjectId },
      select: {
        id: true,
        title: true,
        clientId: true,
        status: true
      }
    });

    if (!project) {
      return res.status(404).json({
        message: 'Projeto não existe.'
      });
    }

    if (Number(project.clientId) === Number(req.userId)) {
      return res.status(403).json({
        message: 'Você não pode enviar uma proposta para o seu próprio projeto.'
      });
    }

    if (project.status !== 'open') {
      return res.status(400).json({
        message: 'Este projeto não está disponível para novas propostas.'
      });
    }

    const existingProposal = await prisma.proposal.findFirst({
      where: {
        projectId: numericProjectId,
        freelancerId: Number(req.userId)
      }
    });

    if (existingProposal) {
      return res.status(409).json({
        message: 'Você já enviou uma proposta para este projeto.'
      });
    }

    const proposal = await prisma.$transaction(async (tx) => {
      const createdProposal = await tx.proposal.create({
        data: {
          projectId: numericProjectId,
          freelancerId: Number(req.userId),
          amount,
          coverText: coverText || null,
          milestonesData: Array.isArray(milestones) ? milestones : [],
          status: 'pending'
        }
      });

      await tx.notification.create({
        data: {
          userId: Number(project.clientId),
          type: 'new_proposal',
          message: `${user.name} enviou uma proposta para o projeto "${project.title}".`
        }
      });

      return createdProposal;
    });

    return res.status(201).json({
      message: 'Proposta enviada!',
      proposal
    });
  } catch (error) {
    next(error);
  }
});

router.get('/projeto/:projectId', authMiddleware, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        message: 'Projeto inválido.'
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        message: 'Projeto não existe.'
      });
    }

    if (Number(project.clientId) !== Number(req.userId)) {
      return res.status(403).json({
        message: 'Ação não autorizada.'
      });
    }

    const proposals = await prisma.proposal.findMany({
      where: { projectId },
      include: {
        freelancer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json(proposals);
  } catch (error) {
    next(error);
  }
});

router.get('/minhas', authMiddleware, async (req, res, next) => {
  try {
    const proposals = await prisma.proposal.findMany({
      where: {
        freelancerId: Number(req.userId)
      },
      include: {
        project: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json(proposals);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/accept', authMiddleware, async (req, res, next) => {
  try {
    const proposalId = Number(req.params.id);

    if (!Number.isInteger(proposalId) || proposalId <= 0) {
      return res.status(400).json({
        message: 'Proposta inválida.'
      });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        project: true,
        freelancer: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!proposal) {
      return res.status(404).json({
        message: 'Proposta não encontrada.'
      });
    }

    if (Number(proposal.project.clientId) !== Number(req.userId)) {
      return res.status(403).json({
        message: 'Ação não autorizada.'
      });
    }

    if (proposal.project.status !== 'open') {
      return res.status(400).json({
        message: 'Este projeto já possui contrato fechado.'
      });
    }

    const milestones = Array.isArray(proposal.milestonesData)
      ? proposal.milestonesData
      : [];

    await prisma.$transaction(async (tx) => {
      const rejectedProposals = await tx.proposal.findMany({
        where: {
          projectId: proposal.projectId,
          id: {
            not: proposalId
          },
          status: 'pending'
        },
        select: {
          freelancerId: true
        }
      });

      await tx.proposal.update({
        where: { id: proposalId },
        data: {
          status: 'accepted'
        }
      });

      await tx.proposal.updateMany({
        where: {
          projectId: proposal.projectId,
          id: {
            not: proposalId
          }
        },
        data: {
          status: 'rejected'
        }
      });

      await tx.project.update({
        where: { id: proposal.projectId },
        data: {
          status: 'open'
        }
      });

      if (milestones.length > 0) {
        await tx.milestone.createMany({
          data: milestones.map((milestone) => ({
            projectId: proposal.projectId,
            title: milestone.title,
            description: milestone.description || '',
            amount: Number(milestone.amount),
            status: 'pending'
          }))
        });
      }

      await tx.chat.create({
        data: {
          projectId: proposal.projectId,
          clientId: Number(req.userId),
          freelancerId: Number(proposal.freelancerId)
        }
      });

      await tx.notification.create({
        data: {
          userId: Number(proposal.freelancerId),
          type: 'proposal_accepted',
          message: `Sua proposta para o projeto "${proposal.project.title}" foi aceita.`
        }
      });

      if (rejectedProposals.length > 0) {
        await tx.notification.createMany({
          data: rejectedProposals.map((rejected) => ({
            userId: Number(rejected.freelancerId),
            type: 'proposal_rejected',
            message: `Sua proposta para o projeto "${proposal.project.title}" não foi selecionada.`
          }))
        });
      }
    });

    return res.json({
      message: 'Contrato fechado! Kanban e chat liberados.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;