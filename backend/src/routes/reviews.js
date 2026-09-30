
const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

router.get('/projeto/:projectId', authMiddleware, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ message: 'ID do projeto inválido.' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
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
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    }

    const acceptedProposal = project.proposals[0];

    if (!acceptedProposal) {
      return res.status(400).json({
        message: 'Este projeto não possui um freelancer contratado.'
      });
    }

    const isClient = Number(project.clientId) === Number(req.userId);
    const isFreelancer =
      Number(acceptedProposal.freelancerId) === Number(req.userId);

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    const review = project.reviews.find(
      item => Number(item.reviewerId) === Number(req.userId)
    );

    return res.json({
      projectId: project.id,
      projectStatus: project.status,
      completed: project.status === 'completed',
      canReview: project.status === 'completed' && !review,
      alreadyReviewed: Boolean(review),
      review: review || null,
      reviewer: {
        id: req.userId,
        role: isClient ? 'client' : 'freelancer'
      },
      reviewee: isClient
        ? acceptedProposal.freelancer
        : {
            id: project.clientId,
            name: project.clientName || null
          }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const projectId = Number(req.body.projectId);
    const rating = Number(req.body.rating);
    const message = typeof req.body.message === 'string'
      ? req.body.message.trim()
      : '';

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ message: 'ID do projeto inválido.' });
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
      return res.status(404).json({ message: 'Projeto não encontrado.' });
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

    const isClient = Number(project.clientId) === Number(req.userId);
    const isFreelancer =
      Number(acceptedProposal.freelancerId) === Number(req.userId);

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    const revieweeId = isClient
      ? acceptedProposal.freelancerId
      : project.clientId;

    const existingReview = await prisma.review.findFirst({
      where: {
        projectId,
        reviewerId: req.userId
      }
    });

    if (existingReview) {
      return res.status(409).json({
        message: 'Você já avaliou este projeto.'
      });
    }

    const review = await prisma.review.create({
      data: {
        projectId,
        reviewerId: req.userId,
        revieweeId,
        rating,
        message: message || null
      }
    });

    await prisma.notification.create({
      data: {
        userId: revieweeId,
        type: 'new_review',
        message: 'Você recebeu uma nova avaliação de um projeto concluído.'
      }
    });

    return res.status(201).json({
      message: 'Avaliação enviada com sucesso.',
      review
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
