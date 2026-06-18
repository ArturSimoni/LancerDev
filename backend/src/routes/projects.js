const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { title, description, budget, deliveryTime } = req.body;

    if (!title || !description || !budget) {
      return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    }

    const newProject = await prisma.project.create({
      data: {
        title,
        description,
        budget: Number(budget), 
        deliveryTime: deliveryTime || null, 
        clientId: req.userId,   
        status: 'open'          
      },
    });

    return res.status(201).json(newProject);
  } catch (error) {
    next(error);
  }
});

router.get('/vitrine', async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        status: 'open',
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.get('/meus-anuncios', authMiddleware, async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { clientId: req.userId }, 
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.post('/propostas', authMiddleware, async (req, res, next) => {
  try {
    const { projectId, coverText, totalAmount, milestones } = req.body;

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

    return res.status(201).json({ message: 'Proposta enviada com sucesso!', proposal });
  } catch (error) {
    next(error);
  }
});

router.get('/:projectId/propostas', authMiddleware, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    }

    if (project.clientId !== req.userId) {
      return res.status(403).json({ message: 'Ação não autorizada.' });
    }

    const proposals = await prisma.proposal.findMany({
      where: { projectId },
      include: {
        freelancer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(proposals);
  } catch (error) {
    next(error);
  }
});

router.post('/propostas/:id/accept', authMiddleware, async (req, res, next) => {
  try {
    const proposalId = Number(req.params.id);
    const { milestones } = req.body;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { project: true }
    });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposta não encontrada.' });
    }

    if (proposal.project.clientId !== req.userId) {
      return res.status(403).json({ message: 'Ação não autorizada.' });
    }

    await prisma.$transaction([
      prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'accepted' }
      }),
      prisma.project.update({
        where: { id: proposal.projectId },
        data: { status: 'in_progress' }
      })
    ]);

    if (milestones && milestones.length > 0) {
      await prisma.milestone.createMany({
        data: milestones.map((m) => ({
          projectId: proposal.projectId,
          title: m.title,
          description: m.description || "",
          amount: Number(m.amount),
          status: 'pending'
        }))
      });
    }

    return res.json({ message: 'Proposta aceita e fluxo Kanban inicializado!' });
  } catch (error) {
    next(error);
  }
});

router.get('/:projectId/milestones', authMiddleware, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { id: 'asc' }
    });

    return res.json(milestones);
  } catch (error) {
    next(error);
  }
});

router.patch('/milestones/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const milestoneId = Number(req.params.id);
    const { status } = req.body;

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          include: { 
            proposals: { where: { status: 'accepted' } } 
          }
        }
      }
    });

    if (!milestone) {
      return res.status(404).json({ message: 'Etapa do Kanban não encontrada.' });
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: { status }
    });

    if (status === 'done') {
      const acceptedProposal = milestone.project.proposals[0];

      if (acceptedProposal) {
        await prisma.payment.create({
          data: {
            projectId: milestone.projectId,
            milestoneId: milestone.id,
            payerId: milestone.project.clientId,
            receiverId: acceptedProposal.freelancerId,
            amount: milestone.amount,
            status: 'paid',
            paidAt: new Date()
          }
        });
      }
    }

    return res.json({ message: 'Status updated', milestone: updatedMilestone });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, budget, deliveryTime } = req.body;

    const project = await prisma.project.findUnique({ where: { id: Number(id) } });
    if (!project || project.clientId !== req.userId) {
      return res.status(403).json({ message: 'Ação não autorizada ou projeto não encontrado.' });
    }

    const updatedProject = await prisma.project.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        budget: Number(budget),
        deliveryTime: deliveryTime || null 
      }
    });

    res.json(updatedProject);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id: Number(id) } });
    if (!project || project.clientId !== req.userId) {
      return res.status(403).json({ message: 'Ação não autorizada ou projeto não encontrado.' });
    }

    await prisma.project.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Anúncio excluído com sucesso.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;