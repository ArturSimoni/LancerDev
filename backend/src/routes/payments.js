const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

const {
  MercadoPagoConfig,
  Preference,
  Payment
} = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
});

router.post('/criar', authMiddleware, async (req, res, next) => {
  try {
    const projectId = Number(req.body.projectId);
    const userId = Number(req.userId);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        message: 'ID do projeto inválido.'
      });
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: 'Usuário não autenticado corretamente.'
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        milestones: true,
        client: {
          select: {
            name: true,
            email: true
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
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        message: 'Projeto não encontrado.'
      });
    }

    if (Number(project.clientId) !== userId) {
      return res.status(403).json({
        message: 'Apenas o cliente responsável pelo projeto pode iniciar o pagamento.'
      });
    }

    const acceptedProposal = project.proposals[0];
    const freelancer = acceptedProposal?.freelancer;

    if (!freelancer) {
      return res.status(400).json({
        message: 'Nenhum freelancer foi contratado neste projeto.'
      });
    }

    const totalAmount = project.milestones.reduce(
      (sum, milestone) => sum + Number(milestone.amount),
      0
    );

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        message: 'O projeto não possui um valor válido para pagamento.'
      });
    }

    if (
      !process.env.BACKEND_URL ||
      !process.env.FRONTEND_URL ||
      !process.env.MERCADOPAGO_ACCESS_TOKEN
    ) {
      return res.status(500).json({
        message: 'As configurações de pagamento não estão completas no servidor.'
      });
    }

    const preference = new Preference(client);

    const prefData = await preference.create({
      body: {
        items: [
          {
            title: `Pagamento do projeto: ${project.title}`,
            quantity: 1,
            unit_price: Number(totalAmount.toFixed(2)),
            currency_id: 'BRL'
          }
        ],
        payer: {
          name: project.client.name,
          email: project.client.email
        },
        back_urls: {
          success: `${process.env.BACKEND_URL}/payments/sucesso`,
          failure: `${process.env.BACKEND_URL}/payments/falha`,
          pending: `${process.env.BACKEND_URL}/payments/pendente`
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL}/payments/webhook`,
        external_reference: String(projectId)
      }
    });

    const payment = await prisma.payment.create({
      data: {
        projectId,
        payerId: userId,
        receiverId: Number(freelancer.id),
        amount: totalAmount,
        status: 'pending',
        mpPreferenceId: String(prefData.id)
      }
    });

    return res.json({
      preferenceId: prefData.id,
      initPoint: prefData.init_point,
      sandboxInitPoint: prefData.sandbox_init_point,
      paymentId: payment.id
    });
  } catch (error) {
    next(error);
  }
});

router.get('/sucesso', (req, res) => {
  try {
    const projectId = req.query.external_reference || '';
    const paymentId = req.query.payment_id || req.query.collection_id || '';
    const status = req.query.status || req.query.collection_status || 'approved';

    const params = new URLSearchParams({
      projectId: String(projectId),
      paymentId: String(paymentId),
      status: String(status)
    });

    return res.redirect(
      `${process.env.FRONTEND_URL}/pagamento/sucesso?${params.toString()}`
    );
  } catch (error) {
    console.error('Erro ao retornar do Mercado Pago:', error);

    return res.redirect(
      `${process.env.FRONTEND_URL}/pagamento/falha`
    );
  }
});

router.get('/falha', (req, res) => {
  const projectId = req.query.external_reference || '';

  const params = new URLSearchParams({
    projectId: String(projectId)
  });

  return res.redirect(
    `${process.env.FRONTEND_URL}/pagamento/falha?${params.toString()}`
  );
});

router.get('/pendente', (req, res) => {
  const projectId = req.query.external_reference || '';
  const paymentId = req.query.payment_id || req.query.collection_id || '';

  const params = new URLSearchParams({
    projectId: String(projectId),
    paymentId: String(paymentId)
  });

  return res.redirect(
    `${process.env.FRONTEND_URL}/pagamento/pendente?${params.toString()}`
  );
});

router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('Webhook Mercado Pago:', req.body);

    if (type !== 'payment' || !data?.id) {
      return res.sendStatus(200);
    }

    const paymentApi = new Payment(client);

    const mpPayment = await paymentApi.get({
      id: data.id
    });

    const projectId = Number(mpPayment.external_reference);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      console.error('Webhook recebido com external_reference inválido:', {
        external_reference: mpPayment.external_reference
      });

      return res.sendStatus(200);
    }

    console.log('Pagamento Mercado Pago:', {
      paymentId: data.id,
      projectId,
      status: mpPayment.status
    });

    if (mpPayment.status !== 'approved') {
      return res.sendStatus(200);
    }

    const updateResult = await prisma.payment.updateMany({
      where: {
        projectId,
        status: 'pending'
      },
      data: {
        status: 'paid',
        mpPaymentId: String(data.id),
        paymentMethod: mpPayment.payment_type_id || null,
        paidAt: new Date()
      }
    });

    if (updateResult.count > 0) {
      const payment = await prisma.payment.findFirst({
        where: {
          projectId,
          mpPaymentId: String(data.id)
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          title: true,
          clientId: true,
          proposals: {
            where: {
              status: 'accepted'
            },
            select: {
              freelancerId: true
            }
          }
        }
      });

      const acceptedProposal = project?.proposals[0];

      if (project && acceptedProposal) {
        const notifications = [
          {
            userId: Number(project.clientId),
            type: 'payment_confirmed',
            message: `O pagamento do projeto "${project.title}" foi confirmado.`
          },
          {
            userId: Number(acceptedProposal.freelancerId),
            type: 'payment_confirmed',
            message: `O pagamento do projeto "${project.title}" foi confirmado pelo cliente.`
          }
        ];

        await prisma.notification.createMany({
          data: notifications
        });
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.sendStatus(500);
  }
});

router.get(
  '/projeto/:projectId',
  authMiddleware,
  async (req, res, next) => {
    try {
      const projectId = Number(req.params.projectId);
      const userId = Number(req.userId);

      if (!Number.isInteger(projectId) || projectId <= 0) {
        return res.status(400).json({
          message: 'ID do projeto inválido.'
        });
      }

      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(401).json({
          message: 'Usuário não autenticado corretamente.'
        });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          clientId: true,
          proposals: {
            where: {
              status: 'accepted'
            },
            select: {
              freelancerId: true
            }
          }
        }
      });

      if (!project) {
        return res.status(404).json({
          message: 'Projeto não encontrado.'
        });
      }

      const isClient = Number(project.clientId) === userId;

      const isAcceptedFreelancer = project.proposals.some(
        (proposal) => Number(proposal.freelancerId) === userId
      );

      if (!isClient && !isAcceptedFreelancer) {
        return res.status(403).json({
          message: 'Você não tem permissão para consultar este pagamento.'
        });
      }

      const payment = await prisma.payment.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({
        payment: payment || null,
        canPay: isClient && payment?.status !== 'paid'
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;