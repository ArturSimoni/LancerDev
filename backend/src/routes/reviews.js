const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

router.get('/pendentes', authMiddleware, async (req, res, next) => {
  try {
    const userId = Number(req.userId);

    const projects = await prisma.project.findMany({
      where: {
        status: 'completed',
        OR: [
          { clientId: userId },
          {
            proposals: {
              some: {
                freelancerId: userId,
                status: 'accepted'
              }
            }
          }
        ]
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        proposals: {
          where: { status: 'accepted' },
          include: {
            freelancer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        reviews: {
          where: {
            reviewerId: userId
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const pendingReviews = projects
      .filter(project => project.proposals.length > 0 && project.reviews.length === 0)
      .map(project => {
        const acceptedProposal = project.proposals[0];
        const isClient = Number(project.clientId) === userId;

        return {
          projectId: project.id,
          projectTitle: project.title,
          projectStatus: project.status,
          reviewee: isClient
            ? acceptedProposal.freelancer
            : project.client
        };
      });

    return res.json(pendingReviews);
  } catch (error) {
    next(error);
  }
});

router.get('/usuario/:userId', authMiddleware, async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: 'ID do usuário inválido.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true
      }
    });

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado.'
      });
    }

    const reviews = await prisma.review.findMany({
      where: {
        revieweeId: userId
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const averageRating = reviews.length > 0
      ? Number(
          (
            reviews.reduce((total, review) => total + review.rating, 0) /
            reviews.length
          ).toFixed(1)
        )
      : 0;

    return res.json({
      user,
      averageRating,
      totalReviews: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
});

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
      where: { id: projectId },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        proposals: {
          where: { status: 'accepted' },
          include: {
            freelancer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        reviews: true
      }
    });

    if (!project) {
      return res.status(404).json({
        message: 'Projeto não encontrado.'
      });
    }

    const acceptedProposal = project.proposals[0];

    if (!acceptedProposal) {
      return res.status(400).json({
        message: 'Este projeto não possui um freelancer contratado.'
      });
    }

    const isClient = Number(project.clientId) === userId;
    const isFreelancer = Number(acceptedProposal.freelancerId) === userId;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        message: 'Acesso negado.'
      });
    }

    const review = project.reviews.find(
      item => Number(item.reviewerId) === userId
    );

    return res.json({
      projectId: project.id,
      projectTitle: project.title,
      projectStatus: project.status,
      completed: project.status === 'completed',
      canReview: project.status === 'completed' && !review,
      alreadyReviewed: Boolean(review),
      review: review || null,
      reviewer: {
        id: userId,
        role: isClient ? 'client' : 'freelancer'
      },
      reviewee: isClient
        ? acceptedProposal.freelancer
        : project.client
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const projectId = Number(req.body.projectId);
    const rating = Number(req.body.rating);
    const userId = Number(req.userId);
    const message = typeof req.body.message === 'string'
      ? req.body.message.trim()
      : '';

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        message: 'ID do projeto inválido.'
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'A avaliação deve ser uma nota entre 1 e 5.'
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        message: 'O comentário deve ter no máximo 1000 caracteres.'
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

    if (project.status !== 'completed') {
      return res.status(400).json({
        message: 'As avaliações estarão disponíveis após a conclusão do projeto.'
      });
    }

    const acceptedProposal = project.proposals[0];

    if (!acceptedProposal) {
      return res.status(400).json({
        message: 'Este projeto não possui um freelancer contratado.'
      });
    }

    const isClient = Number(project.clientId) === userId;
    const isFreelancer = Number(acceptedProposal.freelancerId) === userId;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        message: 'Acesso negado.'
      });
    }

    const revieweeId = isClient
      ? Number(acceptedProposal.freelancerId)
      : Number(project.clientId);

    const existingReview = await prisma.review.findFirst({
      where: {
        projectId,
        reviewerId: userId
      }
    });

    if (existingReview) {
      return res.status(409).json({
        message: 'Você já avaliou este projeto.'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          projectId,
          reviewerId: userId,
          revieweeId,
          rating,
          message: message || null
        },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true
            }
          },
          project: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      await tx.notification.create({
        data: {
          userId: revieweeId,
          type: 'new_review',
          message: `Você recebeu uma nova avaliação do projeto "${project.title}".`
        }
      });

      return review;
    });

    return res.status(201).json({
      message: 'Avaliação enviada com sucesso.',
      review: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;