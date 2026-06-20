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
  } catch (error) { next(error); }
});

router.get('/vitrine', async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { status: 'open' },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (error) { next(error); }
});

router.get('/meus-anuncios', authMiddleware, async (req, res, next) => {
  try {
    console.log("DEBUG: Buscando anúncios para o cliente ID:", req.userId);
    const projects = await prisma.project.findMany({
      where: { clientId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
      include: { client: { select: { name: true } } },
    });
    if (!project) return res.status(404).json({ message: 'Projeto não encontrado.' });
    res.json(project);
  } catch (error) { next(error); }
});

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, budget, deliveryTime } = req.body;
    const project = await prisma.project.findUnique({ where: { id: Number(id) } });
    if (!project || project.clientId !== req.userId) {
      return res.status(403).json({ message: 'Ação não autorizada.' });
    }
    const updatedProject = await prisma.project.update({
      where: { id: Number(id) },
      data: { title, description, budget: Number(budget), deliveryTime: deliveryTime || null }
    });
    res.json(updatedProject);
  } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id: Number(id) } });
    if (!project || project.clientId !== req.userId) {
      return res.status(403).json({ message: 'Ação não autorizada.' });
    }
    await prisma.project.delete({ where: { id: Number(id) } });
    res.json({ message: 'Anúncio excluído com sucesso.' });
  } catch (error) { next(error); }
});

module.exports = router;