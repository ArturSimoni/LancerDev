const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura';

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      }
    });

    return res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno ao cadastrar usuário.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'E-mail ou senha incorretos.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' } // Expira em 1 dia
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno ao realizar login.' });
  }
});

module.exports = router;