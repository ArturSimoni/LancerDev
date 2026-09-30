
const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

router.get('/projeto/:projectId', authMiddleware, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        message: 'ID do projeto inválido.'
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        proposals: {
          where: { status: 'accepted' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        message: 'Projeto não encontrado.'
      });
    }

    const isClient = Number(project.clientId) === Number(req.userId);
    const isFreelancer = project.proposals.some(
      proposal => Number(proposal.freelancerId) === Number(req.userId)
    );

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        message: 'Acesso negado.'
      });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        projectId,
        status: 'paid'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!payment) {
      return res.status(403).json({
        message: 'O pagamento do projeto ainda não foi confirmado.'
      });
    }

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' }
    });

    return res.json(milestones);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const milestoneId = Number(req.params.id);
    const { status } = req.body;

    const validStatus = ['pending', 'in_progress', 'review', 'done'];

    if (!Number.isInteger(milestoneId) || milestoneId <= 0) {
      return res.status(400).json({
        message: 'ID do marco inválido.'
      });
    }

    if (!validStatus.includes(status)) {
      return res.status(400).json({
        message: 'Status inválido.'
      });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          include: {
            proposals: {
              where: { status: 'accepted' }
            }
          }
        }
      }
    });

    if (!milestone) {
      return res.status(404).json({
        message: 'Marco não encontrado.'
      });
    }

    if (milestone.project.status === 'completed') {
      return res.status(400).json({
        message: 'Este projeto já foi concluído.'
      });
    }

    const isClient =
      Number(milestone.project.clientId) === Number(req.userId);

    const acceptedProposal = milestone.project.proposals[0];

    const isFreelancer = acceptedProposal
      ? Number(acceptedProposal.freelancerId) === Number(req.userId)
      : false;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        message: 'Acesso negado.'
      });
    }

    if (isClient) {
      if (milestone.status !== 'review') {
        return res.status(400).json({
          message: 'Você só pode agir em marcos em revisão.'
        });
      }

      if (!['in_progress', 'done'].includes(status)) {
        return res.status(400).json({
          message: 'Ação inválida para o cliente.'
        });
      }
    }

    if (isFreelancer && status === 'done') {
      return res.status(403).json({
        message: 'Apenas o cliente pode aprovar a conclusão.'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedMilestone = await tx.milestone.update({
        where: { id: milestoneId },
        data: { status }
      });

      let projectCompleted = false;

      if (status === 'done') {
        const remainingMilestones = await tx.milestone.count({
          where: {
            projectId: milestone.projectId,
            status: { not: 'done' }
          }
        });

        if (remainingMilestones === 0) {
          await tx.project.update({
            where: { id: milestone.projectId },
            data: { status: 'completed' }
          });

          projectCompleted = true;

          const freelancerId = acceptedProposal.freelancerId;
          const clientId = milestone.project.clientId;

          await tx.notification.createMany({
            data: [
              {
                userId: clientId,
                type: 'project_completed',
                message: `O projeto "${milestone.project.title}" foi concluído. Você já pode avaliar o freelancer.`
              },
              {
                userId: freelancerId,
                type: 'project_completed',
                message: `O projeto "${milestone.project.title}" foi concluído. Você já pode avaliar o cliente.`
              }
            ]
          });
        }
      }

      return {
        updatedMilestone,
        projectCompleted
      };
    });

    return res.json({
      ...result.updatedMilestone,
      projectCompleted: result.projectCompleted,
      message: result.projectCompleted
        ? 'Projeto concluído! As avaliações já estão disponíveis.'
        : 'Marco atualizado com sucesso.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
