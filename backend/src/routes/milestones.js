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
      where: {
        id: projectId
      },
      include: {
        proposals: {
          where: {
            status: 'accepted'
          }
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

    const milestones = await prisma.milestone.findMany({
      where: {
        projectId
      },
      orderBy: {
        id: 'asc'
      }
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

    const validStatuses = [
      'pending',
      'in_progress',
      'in_review',
      'approved'
    ];

    if (!Number.isInteger(milestoneId) || milestoneId <= 0) {
      return res.status(400).json({
        message: 'ID do marco inválido.'
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Status inválido.'
      });
    }

    const milestone = await prisma.milestone.findUnique({
      where: {
        id: milestoneId
      },
      include: {
        project: {
          include: {
            proposals: {
              where: {
                status: 'accepted'
              }
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

    const acceptedProposal = milestone.project.proposals[0];

    if (!acceptedProposal) {
      return res.status(400).json({
        message: 'Este projeto ainda não possui uma proposta aceita.'
      });
    }

    const isClient =
      Number(milestone.project.clientId) === Number(req.userId);

    const isFreelancer =
      Number(acceptedProposal.freelancerId) === Number(req.userId);

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        message: 'Acesso negado.'
      });
    }

    if (isFreelancer) {
      if (
        status === 'in_progress' &&
        milestone.status !== 'pending'
      ) {
        return res.status(400).json({
          message: 'Apenas uma etapa em A Fazer pode ser iniciada.'
        });
      }

      if (
        status === 'pending' &&
        milestone.status !== 'in_progress'
      ) {
        return res.status(400).json({
          message: 'Apenas uma etapa em desenvolvimento pode voltar para A Fazer.'
        });
      }

      if (
        status === 'in_review' &&
        milestone.status !== 'in_progress'
      ) {
        return res.status(400).json({
          message: 'Apenas uma etapa em desenvolvimento pode ser enviada para revisão.'
        });
      }

      if (
        status === 'approved'
      ) {
        return res.status(403).json({
          message: 'Somente o cliente pode aprovar uma etapa.'
        });
      }
    }

    if (isClient) {
      if (
        status !== 'approved' &&
        status !== 'in_progress'
      ) {
        return res.status(403).json({
          message: 'O cliente só pode aprovar a etapa ou solicitar correção.'
        });
      }

      if (milestone.status !== 'in_review') {
        return res.status(400).json({
          message: 'Somente uma etapa em revisão pode ser avaliada.'
        });
      }
    }

    const updatedMilestone = await prisma.milestone.update({
      where: {
        id: milestoneId
      },
      data: {
        status
      }
    });

    return res.json({
      ...updatedMilestone,
      projectCompleted: false,
      message:
        status === 'in_review'
          ? 'Marco enviado para revisão.'
          : status === 'approved'
            ? 'Marco aprovado. O pagamento está disponível.'
            : status === 'in_progress'
              ? 'Marco iniciado.'
              : 'Marco atualizado com sucesso.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;