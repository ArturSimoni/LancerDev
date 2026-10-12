const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const prisma = require('../config/database');
const authMiddleware = require('../middlewares/auth');

const {
  MercadoPagoConfig,
  Preference,
  Payment
} = require('mercadopago');

const MP_REDIRECT_URI = process.env.MP_REDIRECT_URI;

function getOAuthConfig() {
  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;

  if (!clientId || !clientSecret || !MP_REDIRECT_URI) {
    throw new Error('Configurações OAuth do Mercado Pago ausentes.');
  }

  return {
    clientId,
    clientSecret
  };
}

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

function getMarketplaceFee(amount) {
  const percentage = Number(process.env.MP_PLATFORM_FEE_PERCENT || 0);

  if (!Number.isFinite(percentage) || percentage <= 0) {
    return 0;
  }

  const fee = amount * (percentage / 100);

  return Number(fee.toFixed(2));
}

async function refreshSellerToken(account) {
  if (!account?.mpRefreshToken) {
    throw new Error(
      'A conta Mercado Pago do freelancer não possui refresh token.'
    );
  }

  const { clientId, clientSecret } = getOAuthConfig();

  const response = await fetch('https://api.mercadopago.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: account.mpRefreshToken
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Erro ao renovar token Mercado Pago:', {
      status: response.status,
      error: data.error,
      message: data.message
    });

    throw new Error(
      'Não foi possível renovar a conexão Mercado Pago do freelancer.'
    );
  }

  if (!data.access_token) {
    throw new Error('O Mercado Pago não retornou um novo access token.');
  }

  const expiresAt = new Date(
    Date.now() + Number(data.expires_in || 0) * 1000
  );

  const updatedAccount = await prisma.mercadoPagoAccount.update({
    where: {
      userId: account.userId
    },
    data: {
      mpAccessToken: data.access_token,
      mpRefreshToken: data.refresh_token || account.mpRefreshToken,
      mpTokenExpiresAt: expiresAt,
      mpConnectedAt: account.mpConnectedAt || new Date()
    }
  });

  return updatedAccount;
}

async function getSellerAccount(freelancerId) {
  let account = await prisma.mercadoPagoAccount.findUnique({
    where: {
      userId: Number(freelancerId)
    }
  });

  if (!account) {
    throw new Error('O freelancer ainda não conectou uma conta Mercado Pago.');
  }

  if (!account.mpAccessToken || !account.mpRefreshToken) {
    throw new Error('A conexão Mercado Pago do freelancer está incompleta.');
  }

  const expiresAt = account.mpTokenExpiresAt
    ? new Date(account.mpTokenExpiresAt).getTime()
    : 0;

  const shouldRefresh = expiresAt > 0 && expiresAt <= Date.now() + 5 * 60 * 1000;

  if (shouldRefresh) {
    account = await refreshSellerToken(account);
  }

  return account;
}

function createMercadoPagoClient(accessToken) {
  return new MercadoPagoConfig({
    accessToken
  });
}

router.post('/criar', authMiddleware, async (req, res, next) => {
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

    if (!process.env.BACKEND_URL || !process.env.FRONTEND_URL) {
      return res.status(500).json({
        message: 'BACKEND_URL ou FRONTEND_URL não configuradas.'
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

    const acceptedProposal = project.proposals[0];
    const freelancer = acceptedProposal?.freelancer;

    if (!freelancer) {
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

    if (milestoneIndex === -1) {
      return res.status(404).json({
        message: 'Marco não encontrado.'
      });
    }

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

    const existingPayment = await prisma.payment.findFirst({
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

    if (existingPayment?.status === 'paid') {
      return res.status(400).json({
        message: 'Este marco já foi pago.',
        paymentId: existingPayment.id,
        milestoneId
      });
    }

    if (existingPayment?.status === 'pending') {
      return res.status(409).json({
        message: 'Já existe um pagamento pendente para este marco.',
        paymentId: existingPayment.id,
        milestoneId
      });
    }

    let sellerAccount;

    try {
      sellerAccount = await getSellerAccount(freelancer.id);
    } catch (error) {
      return res.status(400).json({
        message: error.message
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
      const mpClient = createMercadoPagoClient(sellerAccount.mpAccessToken);
      const preference = new Preference(mpClient);
      const marketplaceFee = getMarketplaceFee(milestoneAmount);

      const preferenceBody = {
        items: [
          {
            title: `Pagamento do marco: ${
              milestone.title || `Marco ${milestoneIndex + 1}`
            }`,
            quantity: 1,
            unit_price: Number(milestoneAmount.toFixed(2)),
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
        notification_url: `${process.env.BACKEND_URL}/payments/webhook?paymentId=${payment.id}`,
        external_reference: String(payment.id)
      };

      if (marketplaceFee > 0) {
        preferenceBody.marketplace_fee = marketplaceFee;
      }

      const prefData = await preference.create({
        body: preferenceBody
      });

      const updatedPayment = await prisma.payment.update({
        where: {
          id: payment.id
        },
        data: {
          mpPreferenceId: String(prefData.id)
        }
      });

      return res.json({
        preferenceId: prefData.id,
        initPoint: prefData.init_point,
        sandboxInitPoint: prefData.sandbox_init_point,
        paymentId: updatedPayment.id,
        milestoneId,
        amount: Number(milestoneAmount.toFixed(2))
      });
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
    console.error('Erro ao criar pagamento:', error);

    next(error);
  }
});

router.get('/sucesso', (req, res) => {
  try {
    const paymentId = req.query.external_reference || '';

    const mpPaymentId = req.query.payment_id || req.query.collection_id || '';

    const status =
      req.query.status || req.query.collection_status || 'approved';

    const params = new URLSearchParams({
      paymentId: String(paymentId),
      mpPaymentId: String(mpPaymentId),
      status: String(status)
    });

    return res.redirect(
      `${process.env.FRONTEND_URL}/pagamento/sucesso?${params.toString()}`
    );
  } catch (error) {
    console.error('Erro ao retornar do Mercado Pago:', error);

    return res.redirect(`${process.env.FRONTEND_URL}/pagamento/falha`);
  }
});

router.get('/falha', (req, res) => {
  const paymentId = req.query.external_reference || '';

  const params = new URLSearchParams({
    paymentId: String(paymentId)
  });

  return res.redirect(
    `${process.env.FRONTEND_URL}/pagamento/falha?${params.toString()}`
  );
});

router.get('/pendente', (req, res) => {
  const paymentId = req.query.external_reference || '';

  const mpPaymentId = req.query.payment_id || req.query.collection_id || '';

  const params = new URLSearchParams({
    paymentId: String(paymentId),
    mpPaymentId: String(mpPaymentId)
  });

  return res.redirect(
    `${process.env.FRONTEND_URL}/pagamento/pendente?${params.toString()}`
  );
});

router.post('/webhook', async (req, res) => {
  try {
    console.log('Webhook Mercado Pago:', {
      body: req.body,
      query: req.query
    });

    const type = req.body?.type || req.query.type || req.query.topic;
    const mpId = req.body?.data?.id || req.query['data.id'] || req.query.id;

    if (type !== 'payment' || !mpId) {
      return res.sendStatus(200);
    }

    const internalId = Number(req.query.paymentId);

    let payment = null;

    if (Number.isInteger(internalId) && internalId > 0) {
      payment = await prisma.payment.findUnique({
        where: {
          id: internalId
        }
      });
    }

    if (!payment) {
      payment = await prisma.payment.findFirst({
        where: {
          mpPaymentId: String(mpId)
        }
      });
    }

    if (!payment) {
      console.log('Pagamento interno não localizado para o webhook:', mpId);

      return res.sendStatus(200);
    }

    const sellerAccount = await prisma.mercadoPagoAccount.findUnique({
      where: {
        userId: Number(payment.receiverId)
      }
    });

    if (!sellerAccount?.mpAccessToken) {
      console.error(
        'Conta Mercado Pago do vendedor não encontrada para o webhook.',
        {
          receiverId: payment.receiverId
        }
      );

      return res.sendStatus(200);
    }

    let accessToken = sellerAccount.mpAccessToken;

    const expiresAt = sellerAccount.mpTokenExpiresAt
      ? new Date(sellerAccount.mpTokenExpiresAt).getTime()
      : 0;

    if (expiresAt > 0 && expiresAt <= Date.now() + 5 * 60 * 1000) {
      const refreshed = await refreshSellerToken(sellerAccount);

      accessToken = refreshed.mpAccessToken;
    }

    const mpClient = createMercadoPagoClient(accessToken);
    const paymentApi = new Payment(mpClient);

    const mpPayment = await paymentApi.get({
      id: mpId
    });

    if (Number(mpPayment.external_reference) !== Number(payment.id)) {
      console.error('Referência externa divergente no webhook:', {
        mpPaymentId: mpId,
        externalReference: mpPayment.external_reference,
        internalPaymentId: payment.id
      });

      return res.sendStatus(200);
    }

    console.log('Pagamento Mercado Pago:', {
      paymentId: mpId,
      internalPaymentId: payment.id,
      projectId: payment.projectId,
      milestoneId: payment.milestoneId,
      status: mpPayment.status
    });

    if (mpPayment.status === 'approved') {
      if (payment.status !== 'paid') {
        const updatedPayment = await prisma.payment.update({
          where: {
            id: payment.id
          },
          data: {
            status: 'paid',
            mpPaymentId: String(mpId),
            paymentMethod: mpPayment.payment_type_id || null,
            paidAt: new Date()
          }
        });

        const project = await prisma.project.findUnique({
          where: {
            id: payment.projectId
          },
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

        if (project) {
          const acceptedProposal = project.proposals[0];

          const notifications = [
            {
              userId: Number(project.clientId),
              type: 'payment_confirmed',
              message: `O pagamento do marco ${payment.milestoneId} do projeto "${project.title}" foi confirmado.`
            }
          ];

          if (acceptedProposal) {
            notifications.push({
              userId: Number(acceptedProposal.freelancerId),
              type: 'payment_confirmed',
              message: `O pagamento do marco ${payment.milestoneId} do projeto "${project.title}" foi confirmado pelo cliente.`
            });
          }

          await prisma.notification.createMany({
            data: notifications
          });
        }

        console.log('Pagamento atualizado para pago:', {
          paymentId: updatedPayment.id,
          milestoneId: updatedPayment.milestoneId
        });
      }
    } else if (
      mpPayment.status === 'rejected' ||
      mpPayment.status === 'cancelled'
    ) {
      if (payment.status === 'pending') {
        await prisma.payment.update({
          where: {
            id: payment.id
          },
          data: {
            status: mpPayment.status === 'rejected' ? 'rejected' : 'cancelled',
            mpPaymentId: String(mpId),
            paymentMethod: mpPayment.payment_type_id || null
          }
        });
      }
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

    const payments = await prisma.payment.findMany({
      where: {
        projectId
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

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

router.post('/oauth/conectar', authMiddleware, async (req, res) => {
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
        message: 'Somente freelancers podem conectar uma conta Mercado Pago.'
      });
    }

    const { clientId } = getOAuthConfig();

    const verifier = crypto.randomBytes(64).toString('base64url');

    const challenge = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');

    const state = crypto.randomBytes(32).toString('hex');

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.$executeRaw`
      INSERT INTO public.mercadopago_oauth_states
        (state, user_id, verifier, expires_at)
      VALUES
        (${state}, ${userId}, ${verifier}, ${expiresAt})
    `;

    const authorizationUrl = new URL(
      'https://auth.mercadopago.com.br/authorization'
    );

    authorizationUrl.searchParams.set('client_id', clientId);
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('platform_id', 'mp');
    authorizationUrl.searchParams.set('state', state);
    authorizationUrl.searchParams.set('redirect_uri', MP_REDIRECT_URI);
    authorizationUrl.searchParams.set('code_challenge', challenge);
    authorizationUrl.searchParams.set('code_challenge_method', 'S256');

    return res.json({
      url: authorizationUrl.toString()
    });
  } catch (error) {
    console.error('Erro ao iniciar OAuth Mercado Pago:', error);

    return res.status(500).json({
      message: 'Não foi possível iniciar a conexão com o Mercado Pago.'
    });
  }
});

router.get('/oauth/status', authMiddleware, async (req, res) => {
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
        message:
          'Somente freelancers podem consultar a conexão Mercado Pago.'
      });
    }

    const account = await prisma.mercadoPagoAccount.findUnique({
      where: {
        userId
      },
      select: {
        mpUserId: true,
        mpConnectedAt: true
      }
    });

    return res.json({
      connected: Boolean(account?.mpUserId && account?.mpConnectedAt),
      connectedAt: account?.mpConnectedAt || null
    });
  } catch (error) {
    console.error('Erro ao consultar status Mercado Pago:', error);

    return res.status(500).json({
      message: 'Não foi possível consultar a conexão com o Mercado Pago.'
    });
  }
});

router.get('/oauth/callback', async (req, res) => {
  try {
    const {
      code,
      state,
      error: oauthError,
      error_description: oauthErrorDescription
    } = req.query;

    if (oauthError) {
      console.error('Mercado Pago recusou OAuth:', {
        error: oauthError,
        description: oauthErrorDescription
      });

      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard?mercadopago=recusado`
      );
    }

    if (
      typeof code !== 'string' ||
      typeof state !== 'string' ||
      !code ||
      !state
    ) {
      return res
        .status(400)
        .send('Retorno OAuth inválido: código ou state ausente.');
    }

    const rows = await prisma.$queryRaw`
      SELECT
        state,
        user_id,
        verifier,
        expires_at
      FROM public.mercadopago_oauth_states
      WHERE state = ${state}
      LIMIT 1
    `;

    const oauthAttempt = rows[0];

    if (!oauthAttempt) {
      return res
        .status(400)
        .send(
          'Tentativa OAuth inválida ou já utilizada. Inicie a conexão novamente.'
        );
    }

    await prisma.$executeRaw`
      DELETE FROM public.mercadopago_oauth_states
      WHERE state = ${state}
    `;

    if (new Date(oauthAttempt.expires_at).getTime() < Date.now()) {
      return res
        .status(400)
        .send('A tentativa de conexão expirou. Inicie novamente pelo LancerDev.');
    }

    const userId = Number(oauthAttempt.user_id);

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
      return res
        .status(403)
        .send(
          'A conta do LancerDev não possui permissão para conectar Mercado Pago.'
        );
    }

    const { clientId, clientSecret } = getOAuthConfig();

    const tokenBody = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: MP_REDIRECT_URI,
      code_verifier: oauthAttempt.verifier
    };

    if (process.env.MP_TEST_TOKEN !== 'false') {
      tokenBody.test_token = true;
    }

    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tokenBody)
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Erro na troca OAuth:', {
        status: tokenResponse.status,
        error: tokenData.error,
        message: tokenData.message,
        cause: tokenData.cause
      });

      return res
        .status(400)
        .send(
          `O Mercado Pago não autorizou a conexão. ${
            tokenData.message ||
            'Verifique as configurações da aplicação e da conta de teste.'
          }`
        );
    }

    if (
      !tokenData.access_token ||
      !tokenData.refresh_token ||
      !tokenData.user_id
    ) {
      console.error('Resposta OAuth incompleta:', tokenData);

      return res
        .status(502)
        .send('O Mercado Pago retornou uma resposta incompleta.');
    }

    const expiresAt = new Date(
      Date.now() + Number(tokenData.expires_in || 0) * 1000
    );

    await prisma.mercadoPagoAccount.upsert({
      where: {
        userId
      },
      create: {
        userId,
        mpUserId: String(tokenData.user_id),
        mpAccessToken: tokenData.access_token,
        mpRefreshToken: tokenData.refresh_token,
        mpTokenExpiresAt: expiresAt,
        mpConnectedAt: new Date()
      },
      update: {
        mpUserId: String(tokenData.user_id),
        mpAccessToken: tokenData.access_token,
        mpRefreshToken: tokenData.refresh_token,
        mpTokenExpiresAt: expiresAt,
        mpConnectedAt: new Date()
      }
    });

    return res.redirect(
      `${process.env.FRONTEND_URL}/dashboard?mercadopago=conectado`
    );
  } catch (error) {
    console.error('Erro no callback OAuth Mercado Pago:', error);

    return res
      .status(500)
      .send('Erro interno ao concluir a conexão com o Mercado Pago.');
  }
});

module.exports = router;