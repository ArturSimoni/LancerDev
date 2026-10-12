const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const prisma = require('../config/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
        role,
      },
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
      { expiresIn: '1d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno ao realizar login.' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const email = String(req.body.email || '').trim();

  if (!email) {
    return res.status(400).json({ message: 'Informe seu e-mail.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.json({
        message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.',
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expiresAt,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/redefinir-senha?token=${encodeURIComponent(rawToken)}`;

    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Recuperação de senha - LancerDev',
        text: `Olá, ${user.name}!\n\nRecebemos uma solicitação para redefinir sua senha.\nAcesse o link abaixo para criar uma nova senha:\n\n${resetUrl}\n\nEste link expira em 30 minutos. Se você não solicitou a recuperação, ignore este e-mail.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; color: #222;">
            <h2 style="color: #ff6b00;">LancerDev</h2>
            <h3>Recuperação de senha</h3>
            <p>Olá, ${user.name}!</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p style="margin: 28px 0;">
              <a href="${resetUrl}" style="background: #ff6b00; color: #111; padding: 13px 20px; border-radius: 7px; text-decoration: none; font-weight: bold;">
                Redefinir minha senha
              </a>
            </p>
            <p>Este link expira em <strong>30 minutos</strong> e só pode ser utilizado uma vez.</p>
            <p>Se você não solicitou a recuperação, ignore este e-mail.</p>
          </div>
        `,
      });
    } catch (emailError) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      console.error('Erro ao enviar e-mail de recuperação:', emailError);
      return res.status(500).json({
        message: 'Não foi possível enviar o e-mail de recuperação. Verifique a configuração SMTP.',
      });
    }

    return res.json({
      message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.',
    });
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    return res.status(500).json({
      message: 'Erro ao solicitar recuperação de senha.',
    });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      message: 'Token e nova senha são obrigatórios.',
    });
  }

  if (String(password).length < 8) {
    return res.status(400).json({
      message: 'A senha deve possuir pelo menos 8 caracteres.',
    });
  }

  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(String(token))
      .digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Este link é inválido ou expirou. Solicite uma nova recuperação.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.user.updateMany({
      where: {
        id: user.id,
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    if (result.count === 0) {
      return res.status(400).json({
        message: 'Este link é inválido ou expirou. Solicite uma nova recuperação.',
      });
    }

    return res.json({
      message: 'Senha redefinida com sucesso. Você já pode entrar na sua conta.',
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({
      message: 'Erro interno ao redefinir a senha.',
    });
  }
});

module.exports = router;