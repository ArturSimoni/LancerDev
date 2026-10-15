const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

router.get('/projeto/:projectId', authMiddleware, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = Number(req.userId);

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

    const isClient = Number(project.clientId) === userId;

    const isFreelancer = project.proposals.some(
      proposal => Number(proposal.freelancerId) === userId
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
    const userId = Number(req.userId);
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

    const project = milestone.project;

    if (project.status === 'completed') {
      return res.status(400).json({
        message: 'Este projeto já foi concluído.'
      });
    }

    const acceptedProposal = project.proposals[0];

    if (!acceptedProposal) {
      return res.status(400).json({
        message: 'Este projeto ainda não possui uma proposta aceita.'
      });
    }

    const isClient = Number(project.clientId) === userId;

    const isFreelancer =
      Number(acceptedProposal.freelancerId) === userId;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        message: 'Acesso negado.'
      });
    }

    if (isFreelancer) {
      if (status === 'in_progress' && milestone.status !== 'pending') {
        return res.status(400).json({
          message: 'Apenas uma etapa em A Fazer pode ser iniciada.'
        });
      }

      if (status === 'pending' && milestone.status !== 'in_progress') {
        return res.status(400).json({
          message: 'Apenas uma etapa em desenvolvimento pode voltar para A Fazer.'
        });
      }

      if (status === 'in_review' && milestone.status !== 'in_progress') {
        return res.status(400).json({
          message: 'Apenas uma etapa em desenvolvimento pode ser enviada para revisão.'
        });
      }

      if (status === 'approved') {
        return res.status(403).json({
          message: 'Somente o cliente pode aprovar uma etapa.'
        });
      }
    }

    if (isClient) {
      if (status !== 'approved' && status !== 'in_progress') {
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

    const result = await prisma.$transaction(async tx => {
      const updatedMilestone = await tx.milestone.update({
        where: {
          id: milestoneId
        },
        data: {
          status
        }
      });

      const allMilestones = await tx.milestone.findMany({
        where: {
          projectId: project.id
        },
        select: {
          id: true,
          status: true
        }
      });

      const projectCompleted =
        allMilestones.length > 0 &&
        allMilestones.every(item => item.status === 'approved');

      let updatedProject = null;

      if (projectCompleted) {
        updatedProject = await tx.project.update({
          where: {
            id: project.id
          },
          data: {
            status: 'completed'
          }
        });
      } else if (project.status === 'open') {
        updatedProject = await tx.project.update({
          where: {
            id: project.id
          },
          data: {
            status: 'in_progress'
          }
        });
      }

      return {
        updatedMilestone,
        projectCompleted,
        projectStatus: updatedProject?.status || project.status
      };
    });

    if (result.projectCompleted) {
      const reviewNotifications = [
        {
          userId: Number(project.clientId),
          type: 'review_pending',
          message: `O projeto "${project.title}" foi concluído. Avalie o freelancer contratado.`
        },
        {
          userId: Number(acceptedProposal.freelancerId),
          type: 'review_pending',
          message: `O projeto "${project.title}" foi concluído. Avalie o cliente.`
        }
      ];

      await prisma.notification.createMany({
        data: reviewNotifications
      });
    }

    return res.json({
      ...result.updatedMilestone,
      projectCompleted: result.projectCompleted,
      projectStatus: result.projectStatus,
      message: result.projectCompleted
        ? 'Projeto concluído! As avaliações já estão disponíveis para o cliente e o freelancer.'
        : status === 'in_review'
          ? 'Marco enviado para revisão.'
          : status === 'approved'
            ? 'Marco aprovado.'
            : status === 'in_progress'
              ? 'Marco iniciado.'
              : 'Marco atualizado com sucesso.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
