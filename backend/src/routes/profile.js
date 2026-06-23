const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

// CORRIGIDO: rotas específicas ANTES de /:id

// Atualizar perfil próprio
router.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user.role === 'client') {
      const { companyName, companyWebsite, companyDescription } = req.body;
      await prisma.clientProfile.upsert({
        where: { userId },
        update: { companyName, companyWebsite, companyDescription },
        create: { userId, companyName, companyWebsite, companyDescription }
      });
    }

    if (user.role === 'freelancer') {
      const { bio, hourlyRate } = req.body;
      await prisma.freelancerProfile.upsert({
        where: { userId },
        update: { bio, hourlyRate: hourlyRate ? Number(hourlyRate) : null },
        create: { userId, bio, hourlyRate: hourlyRate ? Number(hourlyRate) : null }
      });
    }

    return res.json({ message: 'Perfil atualizado.' });
  } catch (error) { next(error); }
});

// Adicionar projeto GitHub
router.post('/github', authMiddleware, async (req, res, next) => {
  try {
    const { repoUrl, title, description } = req.body;
    if (!repoUrl) return res.status(400).json({ message: 'URL do repositório obrigatória.' });

    const project = await prisma.githubProject.create({
      data: { freelancerId: req.userId, repoUrl, title: title || null, description: description || null }
    });

    return res.status(201).json(project);
  } catch (error) { next(error); }
});

// Remover projeto GitHub
router.delete('/github/:id', authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const project = await prisma.githubProject.findUnique({ where: { id } });

    if (!project || project.freelancerId !== req.userId) {
      return res.status(403).json({ message: 'Ação não autorizada.' });
    }

    await prisma.githubProject.delete({ where: { id } });
    return res.json({ message: 'Projeto removido.' });
  } catch (error) { next(error); }
});

// Adicionar experiência
router.post('/experiencia', authMiddleware, async (req, res, next) => {
  try {
    const { title, company, startDate, endDate, description } = req.body;
    if (!title) return res.status(400).json({ message: 'Título obrigatório.' });

    const exp = await prisma.experience.create({
      data: {
        userId: req.userId,
        title,
        company: company || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description: description || null
      }
    });

    return res.status(201).json(exp);
  } catch (error) { next(error); }
});

// Remover experiência
router.delete('/experiencia/:id', authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const exp = await prisma.experience.findUnique({ where: { id } });

    if (!exp || exp.userId !== req.userId) {
      return res.status(403).json({ message: 'Ação não autorizada.' });
    }

    await prisma.experience.delete({ where: { id } });
    return res.json({ message: 'Experiência removida.' });
  } catch (error) { next(error); }
});

// CORRIGIDO: /:id por último para não engolir as rotas acima
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

    if (user.role === 'client') {
      const [projects, reviews, clientProfile] = await Promise.all([
        prisma.project.findMany({
          where: { clientId: userId },
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, budget: true, status: true, createdAt: true }
        }),
        prisma.review.findMany({
          where: { revieweeId: userId },
          include: { reviewer: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.clientProfile.findUnique({ where: { userId } }).catch(() => null)
      ]);

      return res.json({ ...user, projects, reviews, profile: clientProfile });
    }

    if (user.role === 'freelancer') {
      const [githubProjects, experiences, reviews, freelancerProfile] = await Promise.all([
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
          include: { reviewer: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.freelancerProfile.findUnique({ where: { userId } }).catch(() => null)
      ]);

      return res.json({ ...user, githubProjects, experiences, reviews, profile: freelancerProfile });
    }
  } catch (error) { next(error); }
});

module.exports = router;