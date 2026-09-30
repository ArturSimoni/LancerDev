const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { title, description, budget, deliveryTime } = req.body;

    if (!title || !description || !budget) {
      return res.status(400).json({
        message: 'Campos obrigatórios ausentes.'
      });
    }

    const newProject = await prisma.project.create({
      data: {
        title,
        description,
        budget: Number(budget),
        deliveryTime: deliveryTime || null,
        clientId: Number(req.userId),
        status: 'open'
      }
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
        status: 'open'
      },
      include: {
        client: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.get('/meus-anuncios', authMiddleware, async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        clientId: Number(req.userId)
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.get('/ativos', authMiddleware, async (req, res, next) => {
  try {
    const userId = Number(req.userId);

    const projects = await prisma.project.findMany({
      where: {
        status: 'in_progress',
        OR: [
          {
            clientId: userId
          },
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
          where: {
            status: 'accepted'
          },
          include: {
            freelancer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.get('/historico', authMiddleware, async (req, res, next) => {
  try {
    const userId = Number(req.userId);

    const projects = await prisma.project.findMany({
      where: {
        status: 'completed',
        OR: [
          {
            clientId: userId
          },
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
          where: {
            status: 'accepted'
          },
          include: {
            freelancer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        milestones: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true
              }
            },
            reviewee: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID do projeto inválido.'
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id
      },
      include: {
        client: {
          select: {
            name: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        message: 'Projeto não encontrado.'
      });
    }

    return res.json(project);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, description, budget, deliveryTime } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID do projeto inválido.'
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id
      }
    });

    if (!project || Number(project.clientId) !== Number(req.userId)) {
      return res.status(403).json({
        message: 'Ação não autorizada.'
      });
    }

    const updatedProject = await prisma.project.update({
      where: {
        id
      },
      data: {
        title,
        description,
        budget: Number(budget),
        deliveryTime: deliveryTime || null
      }
    });

    return res.json(updatedProject);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID do projeto inválido.'
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id
      }
    });

    if (!project || Number(project.clientId) !== Number(req.userId)) {
      return res.status(403).json({
        message: 'Ação não autorizada.'
      });
    }

    await prisma.project.delete({
      where: {
        id
      }
    });

    return res.json({
      message: 'Anúncio excluído com sucesso.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;