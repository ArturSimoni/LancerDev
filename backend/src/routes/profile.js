const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

router.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    if (user.role === 'client') {
      const { companyName, companyWebsite, companyDescription } = req.body;

      await prisma.clientProfile.upsert({
        where: { userId },
        update: { companyName, companyWebsite, companyDescription },
        create: { userId, companyName, companyWebsite, companyDescription }
      });
    } else if (user.role === 'freelancer') {
      const { bio, hourlyRate } = req.body;
      const parsedHourlyRate =
        hourlyRate !== undefined && hourlyRate !== null && hourlyRate !== ''
          ? Number(hourlyRate)
          : null;

      if (
        parsedHourlyRate !== null &&
        (!Number.isFinite(parsedHourlyRate) || parsedHourlyRate < 0)
      ) {
        return res.status(400).json({ message: 'Valor da hora inválido.' });
      }

      await prisma.freelancerProfile.upsert({
        where: { userId },
        update: { bio, hourlyRate: parsedHourlyRate },
        create: { userId, bio, hourlyRate: parsedHourlyRate }
      });
    } else {
      return res.status(400).json({ message: 'Tipo de usuário inválido.' });
    }

    return res.json({ message: 'Perfil atualizado.' });
  } catch (error) {
    next(error);
  }
});

router.post('/github', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { repoUrl, title, description } = req.body;

    if (!repoUrl || typeof repoUrl !== 'string' || !repoUrl.trim()) {
      return res.status(400).json({ message: 'URL do repositório obrigatória.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    if (user.role !== 'freelancer') {
      return res.status(403).json({
        message: 'Somente freelancers podem adicionar projetos do GitHub.'
      });
    }

    const project = await prisma.githubProject.create({
      data: {
        freelancerId: userId,
        repoUrl: repoUrl.trim(),
        title: title?.trim() || null,
        description: description?.trim() || null
      }
    });

    return res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

router.delete('/github/:id', authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const project = await prisma.githubProject.findUnique({
      where: { id }
    });

    if (!project) {
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    }

    if (project.freelancerId !== req.userId) {
      return res.status(403).json({ message: 'Ação não autorizada.' });
    }

    await prisma.githubProject.delete({
      where: { id }
    });

    return res.json({ message: 'Projeto removido.' });
  } catch (error) {
    next(error);
  }
});

router.post('/experiencia', authMiddleware, async (req, res, next) => {
  try {
    const { title, company, startDate, endDate, description } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Título obrigatório.' });
    }

    const exp = await prisma.experience.create({
      data: {
        userId: req.userId,
        title: title.trim(),
        company: company?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description: description?.trim() || null
      }
    });

    return res.status(201).json(exp);
  } catch (error) {
    next(error);
  }
});

router.delete('/experiencia/:id', authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const exp = await prisma.experience.findUnique({
      where: { id }
    });

    if (!exp) {
      return res.status(404).json({ message: 'Experiência não encontrada.' });
    }

    if (exp.userId !== req.userId) {
      return res.status(403).json({ message: 'Ação não autorizada.' });
    }

    await prisma.experience.delete({
      where: { id }
    });

    return res.json({ message: 'Experiência removida.' });
  } catch (error) {
    next(error);
  }
});

router.get('/publico/:id', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'ID de usuário inválido.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    if (user.role === 'client') {
      const [clientProfile, projects, reviews] = await Promise.all([
        prisma.clientProfile.findUnique({
          where: { userId },
          select: {
            companyName: true,
            companyWebsite: true,
            companyDescription: true
          }
        }),
        prisma.project.findMany({
          where: { clientId: userId },
          select: {
            id: true,
            title: true,
            budget: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.review.findMany({
          where: { revieweeId: userId },
          select: {
            id: true,
            rating: true,
            message: true,
            createdAt: true,
            reviewer: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      return res.json({
        ...user,
        profile: clientProfile,
        projects,
        reviews
      });
    }

    if (user.role === 'freelancer') {
      const [freelancerProfile, experiences, githubProjects, reviews] =
        await Promise.all([
          prisma.freelancerProfile.findUnique({
            where: { userId },
            select: {
              bio: true,
              hourlyRate: true,
              resumeUrl: true,
              websiteUrl: true
            }
          }),
          prisma.experience.findMany({
            where: { userId },
            select: {
              id: true,
              title: true,
              company: true,
              startDate: true,
              endDate: true,
              description: true
            },
            orderBy: { startDate: 'desc' }
          }),
          prisma.githubProject.findMany({
            where: { freelancerId: userId },
            select: {
              id: true,
              repoUrl: true,
              title: true,
              description: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.review.findMany({
            where: { revieweeId: userId },
            select: {
              id: true,
              rating: true,
              message: true,
              createdAt: true,
              reviewer: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          })
        ]);

      return res.json({
        ...user,
        profile: freelancerProfile,
        experiences,
        githubProjects,
        reviews
      });
    }

    return res.status(400).json({ message: 'Tipo de usuário inválido.' });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'ID de usuário inválido.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    if (user.role === 'freelancer') {
      const [githubProjects, experiences, reviews, freelancerProfile] =
        await Promise.all([
          prisma.githubProject.findMany({
            where: { freelancerId: userId },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.experience.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' }
          }),
          prisma.review.findMany({
            where: { revieweeId: userId },
            include: {
              reviewer: {
                select: { id: true, name: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.freelancerProfile.findUnique({
            where: { userId }
          })
        ]);

      return res.json({
        ...user,
        githubProjects,
        experiences,
        reviews,
        profile: freelancerProfile
      });
    }

    if (user.role === 'client') {
      const [projects, reviews, clientProfile] = await Promise.all([
        prisma.project.findMany({
          where: { clientId: userId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            budget: true,
            status: true,
            createdAt: true
          }
        }),
        prisma.review.findMany({
          where: { revieweeId: userId },
          include: {
            reviewer: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.clientProfile.findUnique({
          where: { userId }
        })
      ]);

      return res.json({
        ...user,
        projects,
        reviews,
        profile: clientProfile
      });
    }

    return res.status(400).json({ message: 'Tipo de usuário inválido.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;