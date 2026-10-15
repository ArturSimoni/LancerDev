const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

const PIX_KEY_TYPES = ['cpf', 'cnpj', 'email', 'phone', 'random'];

function isMilestoneCompleted(status) {
  const normalized = String(status || '')
    .trim()
    .toLowerCase();

  return [
    'completed',
    'complete',
    'done',
    'concluido',
    'concluida',
    'concluído',
    'concluída',
    'finished',
    'finalizado',
    'finalizada',
    'approved',
    'aprovado',
    'aprovada'
  ].includes(normalized);
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizePixKey(type, rawKey) {
  const key = String(rawKey || '').trim();

  if (type === 'cpf') {
    const digits = onlyDigits(key);
    return digits.length === 11 ? digits : null;
  }

  if (type === 'cnpj') {
    const digits = onlyDigits(key);
    return digits.length === 14 ? digits : null;
  }

  if (type === 'email') {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key) && key.length <= 77;
    return valid ? key.toLowerCase() : null;
  }

  if (type === 'phone') {
    const digits = onlyDigits(key);

    if (digits.length === 10 || digits.length === 11) {
      return `+55${digits}`;
    }

    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
      return `+${digits}`;
    }

    return null;
  }

  if (type === 'random') {
    const valid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);

    return valid ? key.toLowerCase() : null;
  }

  return null;
}

function maskPixKey(key) {
  const value = String(key || '');

  if (value.length <= 6) {
    return '***';
  }

  return `${value.slice(0, 3)}***${value.slice(-3)}`;
}

function getMercadoPagoToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.');
  }

  return token;
}

async function createPixOrder({ paymentId, amount, payer }) {
  const token = getMercadoPagoToken();
  const testMode = process.env.MP_PIX_TEST_MODE === 'true';
  const value = Number(amount).toFixed(2);

  const payerData = testMode
    ? {
        email: 'test_user_br@testuser.com',
        first_name: 'APRO'
      }
    : {
        email: payer.email,
        first_name: String(payer.name || '').split(' ')[0] || 'Cliente'
      };

  const response = await fetch('https://api.mercadopago.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Idempotency-Key': crypto.randomUUID()
    },
    body: JSON.stringify({
      type: 'online',
      processing_mode: 'automatic',
      external_reference: String(paymentId),
      total_amount: value,
      payer: payerData,
      transactions: {
        payments: [
          {
            amount: value,
            payment_method: {
              id: 'pix',
              type: 'bank_transfer'
            }
          }
        ]
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Erro ao criar order Pix no Mercado Pago:', {
      status: response.status,
      body: data
    });

    const error = new Error('Falha ao criar order Pix.');
    error.status = 502;
    error.publicMessage =
      'O Mercado Pago não conseguiu gerar o Pix. Tente novamente.';

    throw error;
  }

  return data;
}

async function fetchPixOrder(orderId) {
  const token = getMercadoPagoToken();

  const response = await fetch(
    `https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error('Erro ao consultar order Pix no Mercado Pago:', {
      status: response.status,
      body: data
    });

    throw new Error('Não foi possível consultar o pagamento no Mercado Pago.');
  }

  return data;
}

async function notifyPaid(payment) {
  const project = await prisma.project.findUnique({
    where: {
      id: payment.projectId
    },
    select: {
      title: true
    }
  });

  if (!project) {
    return;
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: Number(payment.payerId),
        type: 'payment_confirmed',
        message: `O pagamento do marco ${payment.milestoneId} do projeto "${project.title}" foi confirmado.`
      },
      {
        userId: Number(payment.receiverId),
        type: 'payment_confirmed',
        message: `O pagamento do marco ${payment.milestoneId} do projeto "${project.title}" foi confirmado e o repasse foi registrado para a sua chave Pix.`
      }
    ]
  });
}

async function completeProjectIfAllPaid(projectId) {
  const milestones = await prisma.milestone.findMany({
    where: {
      projectId
    },
    select: {
      id: true
    }
  });

  if (milestones.length === 0) {
    return false;
  }

  const paidPayments = await prisma.payment.findMany({
    where: {
      projectId,
      status: 'paid',
      milestoneId: {
        in: milestones.map(item => item.id)
      }
    },
    select: {
      milestoneId: true
    }
  });

  const paidIds = new Set(
    paidPayments.map(item => Number(item.milestoneId))
  );

  const allPaid = milestones.every(item => paidIds.has(Number(item.id)));

  if (!allPaid) {
    return false;
  }

  const result = await prisma.project.updateMany({
    where: {
      id: projectId,
      status: {
        not: 'completed'
      }
    },
    data: {
      status: 'completed'
    }
  });

  if (result.count !== 1) {
    return false;
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    },
    select: {
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

  if (project) {
    const notifications = [
      {
        userId: Number(project.clientId),
        type: 'project_completed',
        message: `O projeto "${project.title}" foi concluído. Avalie o freelancer.`
      }
    ];

    if (project.proposals[0]) {
      notifications.push({
        userId: Number(project.proposals[0].freelancerId),
        type: 'project_completed',
        message: `O projeto "${project.title}" foi concluído. Avalie o cliente.`
      });
    }

    await prisma.notification.createMany({
      data: notifications
    });
  }

  return true;
}

async function syncPixPayment(payment) {
  if (!payment || payment.status !== 'pending' || !payment.mpOrderId) {
    return payment;
  }

  const order = await fetchPixOrder(payment.mpOrderId);
  const mpPayment = order.transactions?.payments?.[0];

  const orderStatus = String(order.status || '').toLowerCase();
  const paymentStatus = String(mpPayment?.status || '').toLowerCase();

  const approvedStatuses = ['processed', 'approved', 'accredited'];

  const approved =
    approvedStatuses.includes(orderStatus) ||
    approvedStatuses.includes(paymentStatus);

  const failedStatuses = ['failed', 'canceled', 'cancelled', 'expired'];

  const failed =
    failedStatuses.includes(orderStatus) ||
    failedStatuses.includes(paymentStatus);

  if (approved) {
    const receiver = await prisma.user.findUnique({
      where: {
        id: Number(payment.receiverId)
      },
      select: {
        pixKey: true
      }
    });

    const now = new Date();

    const result = await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: 'pending'
      },
      data: {
        status: 'paid',
        mpPaymentId: mpPayment?.id
          ? String(mpPayment.id)
          : payment.mpPaymentId,
        paymentMethod: 'pix',
        paidAt: now,
        payoutStatus: 'released',
        payoutAt: now,
        payoutPixKey: receiver?.pixKey || null
      }
    });

    if (result.count === 1) {
      await notifyPaid(payment).catch(error => {
        console.error('Erro ao criar notificações de pagamento:', error);
      });

      await completeProjectIfAllPaid(payment.projectId).catch(error => {
        console.error('Erro ao concluir o projeto:', error);
      });
    }

    return prisma.payment.findUnique({
      where: {
        id: payment.id
      }
    });
  }

  if (failed) {
    await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: 'pending'
      },
      data: {
        status: orderStatus === 'failed' || paymentStatus === 'failed'
          ? 'rejected'
          : 'cancelled'
      }
    });

    return prisma.payment.findUnique({
      where: {
        id: payment.id
      }
    });
  }

  return payment;
}

function buildPixResponse(payment) {
  return {
    paymentId: payment.id,
    milestoneId: payment.milestoneId,
    amount: Number(payment.amount),
    status: payment.status,
    payoutStatus: payment.payoutStatus || null,
    pix: {
      qrCode: payment.pixQrCode || '',
      qrCodeBase64: payment.pixQrCodeBase64 || '',
      ticketUrl: payment.pixTicketUrl || ''
    }
  };
}

function stripPixData(payment) {
  const { pixQrCode, pixQrCodeBase64, pixTicketUrl, ...rest } = payment;

  return rest;
}

router.get('/pix-key', authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: 'Usuário não autenticado.'
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        role: true,
        pixKey: true,
        pixKeyType: true
      }
    });

    if (!user || user.role !== 'freelancer') {
      return res.status(403).json({
        message: 'Somente freelancers possuem chave Pix para recebimento.'
      });
    }

    return res.json({
      registered: Boolean(user.pixKey),
      pixKeyType: user.pixKeyType || null,
      pixKeyMasked: user.pixKey ? maskPixKey(user.pixKey) : ''
    });
  } catch (error) {
    console.error('Erro ao consultar chave Pix:', error);

    return res.status(500).json({
      message: 'Não foi possível consultar a chave Pix.'
    });
  }
});

router.put('/pix-key', authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: 'Usuário não autenticado.'
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        role: true
      }
    });

    if (!user || user.role !== 'freelancer') {
      return res.status(403).json({
        message: 'Somente freelancers podem cadastrar chave Pix.'
      });
    }

    const type = String(req.body.pixKeyType || '').toLowerCase();

    if (!PIX_KEY_TYPES.includes(type)) {
      return res.status(400).json({
        message: 'Tipo de chave Pix inválido.'
      });
    }

    const key = normalizePixKey(type, req.body.pixKey);

    if (!key) {
      return res.status(400).json({
        message: 'Chave Pix inválida para o tipo selecionado.'
      });
    }

    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        pixKey: key,
        pixKeyType: type
      }
    });

    return res.json({
      registered: true,
      pixKeyType: type,
      pixKeyMasked: maskPixKey(key)
    });
  } catch (error) {
    console.error('Erro ao salvar chave Pix:', error);

    return res.status(500).json({
      message: 'Não foi possível salvar a chave Pix.'
    });
  }
});

router.post('/criar', authMiddleware, async (req, res) => {
  try {
    const projectId = Number(req.body.projectId);
    const milestoneId = Number(req.body.milestoneId);
    const userId = Number(req.userId);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        message: 'ID do projeto inválido.'
      });
    }

    if (!Number.isInteger(milestoneId) || milestoneId <= 0) {
      return res.status(400).json({
        message: 'ID do marco inválido.'
      });
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: 'Usuário não autenticado corretamente.'
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId
      },
      include: {
        milestones: {
          orderBy: {
            id: 'asc'
          }
        },
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

    if (Number(project.clientId) !== userId) {
      return res.status(403).json({
        message:
          'Apenas o cliente responsável pelo projeto pode realizar o pagamento.'
      });
    }

    const milestone = project.milestones.find(
      item => Number(item.id) === milestoneId
    );

    if (!milestone) {
      return res.status(404).json({
        message: 'Marco não encontrado neste projeto.'
      });
    }

    if (!isMilestoneCompleted(milestone.status)) {
      return res.status(400).json({
        message: 'Este marco ainda não foi concluído pelo freelancer.',
        milestoneId: milestone.id,
        milestoneStatus: milestone.status
      });
    }

    const freelancerId = project.proposals[0]?.freelancerId;

    if (!freelancerId) {
      return res.status(400).json({
        message: 'Nenhum freelancer foi contratado neste projeto.'
      });
    }

    const milestoneAmount = Number(milestone.amount);

    if (!Number.isFinite(milestoneAmount) || milestoneAmount <= 0) {
      return res.status(400).json({
        message: 'O marco não possui um valor válido para pagamento.'
      });
    }

    const orderedMilestones = project.milestones
      .slice()
      .sort((a, b) => Number(a.id) - Number(b.id));

    const milestoneIndex = orderedMilestones.findIndex(
      item => Number(item.id) === milestoneId
    );

    const previousMilestones = orderedMilestones.slice(0, milestoneIndex);

    if (previousMilestones.length > 0) {
      const previousPayments = await prisma.payment.findMany({
        where: {
          projectId,
          milestoneId: {
            in: previousMilestones.map(item => item.id)
          }
        },
        select: {
          milestoneId: true,
          status: true
        }
      });

      const paidMilestoneIds = new Set(
        previousPayments
          .filter(payment => payment.status === 'paid')
          .map(payment => Number(payment.milestoneId))
      );

      const previousMilestonePending = previousMilestones.find(
        item => !paidMilestoneIds.has(Number(item.id))
      );

      if (previousMilestonePending) {
        return res.status(400).json({
          message:
            'Este marco ainda não está liberado para pagamento. O marco anterior precisa ser pago primeiro.',
          previousMilestoneId: previousMilestonePending.id
        });
      }
    }

    let existingPayment = await prisma.payment.findFirst({
      where: {
        projectId,
        milestoneId,
        status: {
          in: ['pending', 'paid']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existingPayment?.status === 'pending') {
      try {
        existingPayment = await syncPixPayment(existingPayment);
      } catch (error) {
        console.error('Erro ao sincronizar pagamento pendente:', error);
      }
    }

    if (existingPayment?.status === 'paid') {
      return res.status(400).json({
        message: 'Este marco já foi pago.',
        paymentId: existingPayment.id,
        milestoneId
      });
    }

    if (existingPayment?.status === 'pending') {
      if (existingPayment.pixQrCode) {
        return res.json(buildPixResponse(existingPayment));
      }

      await prisma.payment
        .delete({
          where: {
            id: existingPayment.id
          }
        })
        .catch(() => {});
    }

    const freelancer = await prisma.user.findUnique({
      where: {
        id: Number(freelancerId)
      },
      select: {
        id: true,
        pixKey: true
      }
    });

    if (!freelancer?.pixKey) {
      return res.status(400).json({
        message: 'O freelancer ainda não cadastrou a chave Pix para receber.'
      });
    }

    const payment = await prisma.payment.create({
      data: {
        projectId,
        milestoneId,
        payerId: userId,
        receiverId: Number(freelancer.id),
        amount: Number(milestoneAmount.toFixed(2)),
        status: 'pending'
      }
    });

    try {
      const order = await createPixOrder({
        paymentId: payment.id,
        amount: milestoneAmount,
        payer: project.client
      });

      const mpPayment = order.transactions?.payments?.[0];
      const method = mpPayment?.payment_method || {};

      const updatedPayment = await prisma.payment.update({
        where: {
          id: payment.id
        },
        data: {
          mpOrderId: String(order.id),
          mpPaymentId: mpPayment?.id ? String(mpPayment.id) : null,
          paymentMethod: 'pix',
          pixQrCode: method.qr_code || null,
          pixQrCodeBase64: method.qr_code_base64 || null,
          pixTicketUrl: method.ticket_url || null
        }
      });

      let current = updatedPayment;

      try {
        current = await syncPixPayment(updatedPayment);
      } catch (error) {
        console.error('Erro ao sincronizar pagamento recém-criado:', error);
      }

      return res.json(buildPixResponse(current));
    } catch (error) {
      await prisma.payment
        .delete({
          where: {
            id: payment.id
          }
        })
        .catch(() => {});

      throw error;
    }
  } catch (error) {
    console.error('Erro ao criar pagamento Pix:', error);

    return res.status(error.status || 500).json({
      message:
        error.publicMessage || 'Não foi possível gerar o pagamento Pix.'
    });
  }
});

router.get('/:id/status', authMiddleware, async (req, res) => {
  try {
    const paymentId = Number(req.params.id);
    const userId = Number(req.userId);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res.status(400).json({
        message: 'ID do pagamento inválido.'
      });
    }

    let payment = await prisma.payment.findUnique({
      where: {
        id: paymentId
      }
    });

    if (!payment) {
      return res.status(404).json({
        message: 'Pagamento não encontrado.'
      });
    }

    if (
      Number(payment.payerId) !== userId &&
      Number(payment.receiverId) !== userId
    ) {
      return res.status(403).json({
        message: 'Você não tem permissão para consultar este pagamento.'
      });
    }

    try {
      payment = await syncPixPayment(payment);
    } catch (error) {
      console.error('Erro ao sincronizar pagamento:', error);
    }

    return res.json({
      paymentId: payment.id,
      status: payment.status,
      payoutStatus: payment.payoutStatus || null
    });
  } catch (error) {
    console.error('Erro ao consultar status do pagamento:', error);

    return res.status(500).json({
      message: 'Não foi possível consultar o pagamento.'
    });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const rawId =
      req.body?.data?.id || req.query['data.id'] || req.query.id;

    const orderId = rawId ? String(rawId) : '';

    if (!orderId) {
      return res.sendStatus(200);
    }

    const payment = await prisma.payment.findFirst({
      where: {
        mpOrderId: orderId
      }
    });

    if (payment) {
      await syncPixPayment(payment);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook:', error);

    return res.sendStatus(500);
  }
});

router.get('/projeto/:projectId', authMiddleware, async (req, res, next) => {
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
      where: {
        id: projectId
      },
      include: {
        milestones: {
          orderBy: {
            id: 'asc'
          }
        },
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
      proposal => Number(proposal.freelancerId) === userId
    );

    if (!isClient && !isAcceptedFreelancer) {
      return res.status(403).json({
        message:
          'Você não tem permissão para consultar os pagamentos deste projeto.'
      });
    }

    const rawPayments = await prisma.payment.findMany({
      where: {
        projectId
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const payments = rawPayments.map(stripPixData);

    const paymentsByMilestone = new Map();

    for (const payment of payments) {
      paymentsByMilestone.set(Number(payment.milestoneId), payment);
    }

    const milestonePayments = project.milestones.map((milestone, index) => {
      const payment = paymentsByMilestone.get(Number(milestone.id)) || null;

      const previousMilestones = project.milestones.slice(0, index);

      const previousMilestonesPaid = previousMilestones.every(
        previousMilestone => {
          const previousPayment = paymentsByMilestone.get(
            Number(previousMilestone.id)
          );

          return previousPayment?.status === 'paid';
        }
      );

      const completed = isMilestoneCompleted(milestone.status);
      const paid = payment?.status === 'paid';
      const pending = payment?.status === 'pending';

      const canPay = Boolean(
        isClient && completed && previousMilestonesPaid && !paid && !pending
      );

      return {
        milestoneId: milestone.id,
        milestoneStatus: milestone.status,
        completed,
        paid,
        pending,
        canPay,
        payment
      };
    });

    const currentMilestone = milestonePayments.find(item => !item.paid) || null;

    const currentPayment =
      payments
        .slice()
        .reverse()
        .find(payment => payment.status === 'pending') || null;

    const canPay = Boolean(milestonePayments.some(item => item.canPay));

    const allPaid =
      project.milestones.length > 0 &&
      project.milestones.every(milestone => {
        const payment = paymentsByMilestone.get(Number(milestone.id));

        return payment?.status === 'paid';
      });

    return res.json({
      payments,
      milestonePayments,
      payment: currentPayment || payments[payments.length - 1] || null,
      currentMilestone,
      currentPayment,
      canPay,
      allPaid
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;