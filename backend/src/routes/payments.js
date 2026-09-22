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


// ======================================================
// CRIAR PAGAMENTO
// ======================================================

router.post('/criar', authMiddleware, async (req, res, next) => {
  try {
    const { projectId } = req.body;

    const project = await prisma.project.findUnique({
      where: {
        id: Number(projectId)
      },
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

    if (project.clientId !== req.userId) {
      return res.status(403).json({
        message: 'Apenas o cliente pode iniciar o pagamento.'
      });
    }

    const acceptedProposal = project.proposals[0];

    const freelancer = acceptedProposal?.freelancer;

    if (!freelancer) {
      return res.status(400).json({
        message: 'Nenhum freelancer contratado neste projeto.'
      });
    }

    const totalAmount = project.milestones.reduce(
      (sum, milestone) => sum + Number(milestone.amount),
      0
    );

    if (totalAmount <= 0) {
      return res.status(400).json({
        message: 'O projeto não possui um valor válido para pagamento.'
      });
    }

    const preference = new Preference(client);

    const prefData = await preference.create({
      body: {
        items: [
          {
            title: `Pagamento em escrow — ${project.title}`,
            quantity: 1,
            unit_price: Number(totalAmount),
            currency_id: 'BRL'
          }
        ],

        payer: {
          name: project.client.name,
          email: project.client.email
        },

        // IMPORTANTE:
        // Como o router está montado em /payments,
        // as rotas são /payments/sucesso, /payments/falha etc.
        back_urls: {
          success: `${process.env.BACKEND_URL}/payments/sucesso`,
          failure: `${process.env.BACKEND_URL}/payments/falha`,
          pending: `${process.env.BACKEND_URL}/payments/pendente`
        },

        auto_return: 'approved',

        notification_url:
          `${process.env.BACKEND_URL}/payments/webhook`,

        external_reference: String(projectId)
      }
    });

    const payment = await prisma.payment.create({
      data: {
        projectId: Number(projectId),
        payerId: req.userId,
        receiverId: acceptedProposal.freelancerId,
        amount: totalAmount,
        status: 'pending',
        mpPreferenceId: prefData.id
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


// ======================================================
// RETORNO DE PAGAMENTO APROVADO
// ======================================================

router.get('/sucesso', (req, res) => {
  try {
    console.log('Retorno de pagamento aprovado:');
    console.log(req.query);

    const projectId =
      req.query.external_reference || '';

    const paymentId =
      req.query.payment_id ||
      req.query.collection_id ||
      '';

    const status =
      req.query.status ||
      req.query.collection_status ||
      'approved';

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


// ======================================================
// RETORNO DE PAGAMENTO COM FALHA
// ======================================================

router.get('/falha', (req, res) => {
  const projectId =
    req.query.external_reference || '';

  const params = new URLSearchParams({
    projectId: String(projectId)
  });

  return res.redirect(
    `${process.env.FRONTEND_URL}/pagamento/falha?${params.toString()}`
  );
});


// ======================================================
// RETORNO DE PAGAMENTO PENDENTE
// ======================================================

router.get('/pendente', (req, res) => {
  const projectId =
    req.query.external_reference || '';

  const paymentId =
    req.query.payment_id ||
    req.query.collection_id ||
    '';

  const params = new URLSearchParams({
    projectId: String(projectId),
    paymentId: String(paymentId)
  });

  return res.redirect(
    `${process.env.FRONTEND_URL}/pagamento/pendente?${params.toString()}`
  );
});


// ======================================================
// WEBHOOK DO MERCADO PAGO
// ======================================================

router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('Webhook Mercado Pago:', req.body);

    if (type === 'payment') {
      const paymentApi = new Payment(client);

      const mpPayment = await paymentApi.get({
        id: data.id
      });

      const projectId = Number(
        mpPayment.external_reference
      );

      const status = mpPayment.status;

      console.log('Pagamento Mercado Pago:', {
        paymentId: data.id,
        projectId,
        status
      });

      if (status === 'approved') {

        await prisma.payment.updateMany({
          where: {
            projectId,
            status: 'pending'
          },

          data: {
            status: 'paid',
            mpPaymentId: String(data.id),
            paymentMethod: mpPayment.payment_type_id,
            paidAt: new Date()
          }
        });

        const project = await prisma.project.findUnique({
          where: {
            id: projectId
          },

          include: {
            proposals: {
              where: {
                status: 'accepted'
              }
            }
          }
        });

        if (project?.proposals[0]) {

          await prisma.notification.create({
            data: {
              userId:
                project.proposals[0].freelancerId,

              type: 'payment',

              message:
                `Pagamento de escrow recebido para o projeto "${project.title}". Os valores serão liberados conforme aprovação dos marcos.`
            }
          });
        }
      }
    }

    return res.sendStatus(200);

  } catch (error) {

    console.error(
      'Erro no webhook:',
      error
    );

    return res.sendStatus(500);
  }
});


// ======================================================
// BUSCAR STATUS DO PAGAMENTO
// ======================================================

router.get(
  '/projeto/:projectId',
  authMiddleware,
  async (req, res, next) => {

    try {

      const projectId =
        Number(req.params.projectId);

      const payment =
        await prisma.payment.findFirst({
          where: {
            projectId
          },

          orderBy: {
            createdAt: 'desc'
          }
        });

      return res.json(
        payment || null
      );

    } catch (error) {

      next(error);
    }
  }
);


module.exports = router;