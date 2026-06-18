const express = require('express');
const router = express.Router();
const prisma = require('../config/database');

router.post('/', async (req, res, next) => {
  try {
    const { name, email, role, bio, hourlyRate } = req.body;

    if (!name || !email || !role) {
      const error = new Error('Campos obrigatórios ausentes: name, email, role.');
      error.statusCode = 400;
      throw error;
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: { name, role, bio, hourlyRate },
      create: { name, email, role, bio, hourlyRate },
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        githubProjects: true, 
        experiences: true, 
      },
    });

    if (!user) {
      const error = new Error('Usuário não encontrado.');
      error.statusCode = 404;
      throw error;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;