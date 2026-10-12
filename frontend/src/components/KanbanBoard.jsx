import { useState, useEffect, useMemo, useCallback } from 'react';

import api from '../services/api';

const COLUMNS = [
  {
    id: 'pending',
    title: 'A Fazer',
    color: '#8b8b8b',
    description: 'Etapas aguardando início'
  },
  {
    id: 'in_progress',
    title: 'Desenvolvendo',
    color: '#ff6b00',
    description: 'Etapas em execução'
  },
  {
    id: 'in_review',
    title: 'Em Revisão',
    color: '#f5a623',
    description: 'Aguardando aprovação do cliente'
  },
  {
    id: 'approved',
    title: 'Aprovado',
    color: '#00c851',
    description: 'Entrega aprovada pelo cliente'
  }
];

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function isPaid(payment) {
  return payment?.status === 'paid';
}

export default function KanbanBoard({
  projectId,
  isFreelancer,
  onProjectCompleted,
  onMilestoneUpdated
}) {
  const [milestones, setMilestones] = useState([]);
  const [payments, setPayments] = useState([]);
  const [payability, setPayability] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [moving, setMoving] = useState(null);
  const [paying, setPaying] = useState(null);
  const [error, setError] = useState('');

  const loadData = useCallback(async (showLoading = true) => {
    if (!projectId) {
      return;
    }

    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError('');

    try {
      const [milestonesResponse, paymentsResponse] =
        await Promise.all([
          api.get(`/milestones/projeto/${projectId}`),
          api.get(`/payments/projeto/${projectId}`)
        ]);

      const milestoneData = Array.isArray(milestonesResponse.data)
        ? milestonesResponse.data
        : [];

      const paymentData = Array.isArray(paymentsResponse.data)
        ? paymentsResponse.data
        : Array.isArray(paymentsResponse.data?.payments)
          ? paymentsResponse.data.payments
          : [];

      const milestonePayments = Array.isArray(
        paymentsResponse.data?.milestonePayments
      )
        ? paymentsResponse.data.milestonePayments
        : [];

      setMilestones(
        milestoneData
          .slice()
          .sort((a, b) => Number(a.id) - Number(b.id))
      );

      setPayments(paymentData);

      setPayability(
        new Map(
          milestonePayments.map(item => [
            Number(item.milestoneId),
            item
          ])
        )
      );
    } catch (err) {
      console.error('Erro ao carregar dados dos marcos:', err);

      setError(
        err.response?.data?.message ||
        'Não foi possível carregar os marcos e pagamentos.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const paymentMap = useMemo(() => {
    const map = new Map();

    payments.forEach(payment => {
      const milestoneId = Number(payment.milestoneId);

      if (!map.has(milestoneId)) {
        map.set(milestoneId, payment);
        return;
      }

      const current = map.get(milestoneId);

      if (
        payment.status === 'paid' ||
        payment.createdAt > current.createdAt
      ) {
        map.set(milestoneId, payment);
      }
    });

    return map;
  }, [payments]);

  const summary = useMemo(() => {
    const total = milestones.length;

    const approved = milestones.filter(
      item => item.status === 'approved'
    ).length;

    const inReview = milestones.filter(
      item => item.status === 'in_review'
    ).length;

    const totalAmount = milestones.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const approvedAmount = milestones
      .filter(item => item.status === 'approved')
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

    const paidAmount = milestones
      .filter(item => isPaid(paymentMap.get(Number(item.id))))
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

    return {
      total,
      approved,
      inReview,
      totalAmount,
      approvedAmount,
      paidAmount,
      percentage:
        total > 0
          ? Math.round((approved / total) * 100)
          : 0,
      finished: total > 0 && approved === total
    };
  }, [milestones, paymentMap]);

  async function moveCard(milestoneId, newStatus) {
    setMoving(milestoneId);
    setError('');

    try {
      const response = await api.patch(
        `/milestones/${milestoneId}/status`,
        {
          status: newStatus
        }
      );

      setMilestones(current =>
        current.map(item =>
          Number(item.id) === Number(milestoneId)
            ? {
                ...item,
                ...response.data,
                status: newStatus
              }
            : item
        )
      );

      await onMilestoneUpdated?.({
        milestoneId,
        status: newStatus,
        projectCompleted:
          response.data?.projectCompleted || false
      });

      await loadData(false);

      if (response.data?.projectCompleted) {
        await onProjectCompleted?.();
      }
    } catch (err) {
      console.error('Erro ao atualizar marco:', err);

      setError(
        err.response?.data?.message ||
        'Não foi possível atualizar esta etapa.'
      );
    } finally {
      setMoving(null);
    }
  }

  async function handlePayMilestone(milestoneId) {
    setPaying(milestoneId);
    setError('');

    try {
      const response = await api.post('/payments/criar', {
        projectId: Number(projectId),
        milestoneId: Number(milestoneId)
      });

      const checkoutUrl =
        response.data?.sandboxInitPoint ||
        response.data?.initPoint;

      if (!checkoutUrl) {
        throw new Error(
          'O Mercado Pago não retornou o endereço de pagamento.'
        );
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Erro ao iniciar pagamento:', err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'Não foi possível iniciar o pagamento.'
      );

      setPaying(null);
    }
  }

  function renderPaymentArea(item) {
    const payment = paymentMap.get(Number(item.id));
    const paid = isPaid(payment);

    if (paid) {
      return (
        <div style={s.paidBox}>
          <div style={s.paidTitle}>
            <span>✓</span>
            Pagamento confirmado
          </div>

          <p style={s.paidText}>
            Este marco foi pago pelo cliente.
          </p>
        </div>
      );
    }

    if (payment?.status === 'pending') {
      return (
        <div style={s.pendingPaymentBox}>
          <div style={s.pendingPaymentTitle}>
            <span>⏳</span>
            Pagamento em processamento
          </div>

          <p style={s.pendingPaymentText}>
            Aguarde a confirmação do Mercado Pago.
          </p>
        </div>
      );
    }

    if (item.status !== 'approved') {
      return null;
    }

    if (isFreelancer) {
      return (
        <div style={s.receiveBox}>
          <div style={s.receiveTitle}>
            <span>💰</span>
            Pagamento liberado
          </div>

          <p style={s.receiveText}>
            O cliente precisa realizar o pagamento deste marco.
          </p>
        </div>
      );
    }

    const canPay = Boolean(
      payability.get(Number(item.id))?.canPay
    );

    if (!canPay) {
      return (
        <div style={s.pendingPaymentBox}>
          <div style={s.pendingPaymentTitle}>
            <span>🔒</span>
            Pagamento bloqueado
          </div>

          <p style={s.pendingPaymentText}>
            Os marcos anteriores precisam ser concluídos e pagos primeiro.
          </p>
        </div>
      );
    }

    return (
      <div style={s.payBox}>
        <div style={s.payTitle}>
          <span>💳</span>
          Pagamento disponível
        </div>

        <p style={s.payText}>
          Este marco foi aprovado. Você pode realizar o pagamento de{' '}
          <strong>{formatCurrency(item.amount)}</strong>.
        </p>

        <button
          type="button"
          disabled={paying === item.id}
          onClick={() => handlePayMilestone(item.id)}
          style={{
            ...s.payButton,
            opacity: paying === item.id ? 0.6 : 1
          }}
        >
          {paying === item.id
            ? 'Abrindo Mercado Pago...'
            : 'Pagar este marco'}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={s.stateContainer}>
        <div style={s.loader} />
        <p style={s.stateText}>
          Carregando quadro de etapas...
        </p>
      </div>
    );
  }

  if (error && milestones.length === 0) {
    return (
      <div style={s.errorBox}>
        <div style={s.errorIcon}>!</div>

        <div>
          <strong style={s.errorTitle}>
            Não foi possível carregar o Kanban
          </strong>

          <p style={s.errorText}>
            {error}
          </p>

          <button
            type="button"
            onClick={() => loadData()}
            style={s.retryButton}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div style={s.emptyState}>
        <div style={s.emptyIcon}>▦</div>

        <h3 style={s.emptyTitle}>
          Nenhuma etapa cadastrada
        </h3>

        <p style={s.emptyText}>
          Este projeto ainda não possui etapas.
        </p>
      </div>
    );
  }

  return (
    <section style={s.wrapper}>
      <div style={s.topBar}>
        <div>
          <h3 style={s.boardTitle}>
            Quadro de acompanhamento
          </h3>

          <p style={s.boardSubtitle}>
            Acompanhe desenvolvimento, aprovação e pagamento de cada marco.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(false)}
          disabled={refreshing || moving !== null || paying !== null}
          style={{
            ...s.refreshButton,
            opacity:
              refreshing || moving !== null || paying !== null
                ? 0.6
                : 1
          }}
        >
          ↻ {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {error && (
        <div style={s.inlineError}>
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError('')}
            style={s.dismissError}
          >
            ×
          </button>
        </div>
      )}

      <div style={s.summary}>
        <div style={s.summaryMain}>
          <div style={s.summaryNumbers}>
            <span style={s.summaryLabel}>
              Progresso geral
            </span>

            <strong style={s.percentage}>
              {summary.percentage}%
            </strong>
          </div>

          <div style={s.progressTrack}>
            <div
              style={{
                ...s.progressFill,
                width: `${summary.percentage}%`
              }}
            />
          </div>

          <span style={s.progressCaption}>
            {summary.approved} de {summary.total} etapas aprovadas
          </span>
        </div>

        <div style={s.summaryMetric}>
          <span style={s.metricLabel}>
            Em revisão
          </span>

          <strong style={{ ...s.metricValue, color: '#f5a623' }}>
            {summary.inReview}
          </strong>
        </div>

        <div style={s.summaryMetric}>
          <span style={s.metricLabel}>
            Valor total
          </span>

          <strong style={s.metricValue}>
            {formatCurrency(summary.totalAmount)}
          </strong>
        </div>

        <div style={s.summaryMetric}>
          <span style={s.metricLabel}>
            Pago
          </span>

          <strong
            style={{
              ...s.metricValue,
              color: '#00c851'
            }}
          >
            {formatCurrency(summary.paidAmount)}
          </strong>
        </div>
      </div>

      {summary.inReview > 0 && !isFreelancer && (
        <div style={s.reviewBanner}>
          <span style={s.reviewIcon}>!</span>

          <div>
            <strong>
              Existem etapas aguardando sua revisão
            </strong>

            <p>
              Analise as entregas realizadas pelo freelancer e aprove ou solicite correções.
            </p>
          </div>
        </div>
      )}

      {summary.finished && (
        <div style={s.completedBanner}>
          <span style={s.completedIcon}>✓</span>

          <div>
            <strong>
              Todas as etapas foram aprovadas
            </strong>

            <p>
              Os pagamentos podem ser realizados nos respectivos marcos.
            </p>
          </div>
        </div>
      )}

      <div style={s.board}>
        {COLUMNS.map(column => {
          const cards = milestones.filter(
            item => item.status === column.id
          );

          return (
            <div
              key={column.id}
              style={s.column}
            >
              <div style={s.columnHeader}>
                <div style={s.columnHeading}>
                  <span
                    style={{
                      ...s.columnDot,
                      backgroundColor: column.color,
                      boxShadow: `0 0 10px ${column.color}55`
                    }}
                  />

                  <div>
                    <h4 style={s.columnTitle}>
                      {column.title}
                    </h4>

                    <p style={s.columnDescription}>
                      {column.description}
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    ...s.count,
                    color: column.color,
                    borderColor: `${column.color}55`,
                    backgroundColor: `${column.color}12`
                  }}
                >
                  {cards.length}
                </span>
              </div>

              <div style={s.cardList}>
                {cards.map(item => {
                  const isMoving =
                    Number(moving) === Number(item.id);

                  return (
                    <article
                      key={item.id}
                      style={s.card}
                    >
                      <div style={s.cardTop}>
                        <span style={s.cardNumber}>
                          ETAPA #{String(item.id).padStart(2, '0')}
                        </span>

                        <span
                          style={{
                            ...s.cardStatus,
                            color: column.color,
                            backgroundColor: `${column.color}15`
                          }}
                        >
                          {column.title}
                        </span>
                      </div>

                      <h5 style={s.cardTitle}>
                        {item.title}
                      </h5>

                      {item.description ? (
                        <p style={s.cardDescription}>
                          {item.description}
                        </p>
                      ) : (
                        <p style={s.noDescription}>
                          Sem descrição informada.
                        </p>
                      )}

                      <div style={s.cardFooter}>
                        <span style={s.amountLabel}>
                          Valor da etapa
                        </span>

                        <strong style={s.amount}>
                          {formatCurrency(item.amount)}
                        </strong>
                      </div>

                      {isFreelancer && (
                        <div style={s.actions}>
                          {column.id === 'pending' && (
                            <button
                              type="button"
                              disabled={isMoving}
                              onClick={() =>
                                moveCard(
                                  item.id,
                                  'in_progress'
                                )
                              }
                              style={s.primaryAction}
                            >
                              {isMoving
                                ? 'Atualizando...'
                                : 'Iniciar etapa'}

                              <span>→</span>
                            </button>
                          )}

                          {column.id === 'in_progress' && (
                            <>
                              <button
                                type="button"
                                disabled={isMoving}
                                onClick={() =>
                                  moveCard(
                                    item.id,
                                    'pending'
                                  )
                                }
                                style={s.backAction}
                              >
                                Voltar
                              </button>

                              <button
                                type="button"
                                disabled={isMoving}
                                onClick={() =>
                                  moveCard(
                                    item.id,
                                    'in_review'
                                  )
                                }
                                style={s.completeAction}
                              >
                                {isMoving
                                  ? 'Enviando...'
                                  : 'Enviar para revisão'}

                                <span>✓</span>
                              </button>
                            </>
                          )}

                          {column.id === 'in_review' && (
                            <div style={s.reviewWaiting}>
                              <span>⏳</span>
                              Aguardando revisão do cliente.
                            </div>
                          )}

                          {column.id === 'approved' && (
                            <div style={s.approvedBadge}>
                              <span>✓</span>
                              Entrega aprovada pelo cliente.
                            </div>
                          )}
                        </div>
                      )}

                      {!isFreelancer &&
                        column.id === 'in_review' && (
                          <div style={s.clientReview}>
                            <div style={s.reviewTitle}>
                              <span>🔎</span>
                              Revisar entrega
                            </div>

                            <p style={s.reviewText}>
                              O freelancer enviou esta etapa para revisão.
                            </p>

                            <div style={s.reviewActions}>
                              <button
                                type="button"
                                disabled={isMoving}
                                onClick={() =>
                                  moveCard(
                                    item.id,
                                    'in_progress'
                                  )
                                }
                                style={s.rejectAction}
                              >
                                Solicitar correção
                              </button>

                              <button
                                type="button"
                                disabled={isMoving}
                                onClick={() =>
                                  moveCard(
                                    item.id,
                                    'approved'
                                  )
                                }
                                style={s.approveAction}
                              >
                                {isMoving
                                  ? 'Aprovando...'
                                  : 'Aprovar entrega'}

                                <span>✓</span>
                              </button>
                            </div>
                          </div>
                        )}

                      {!isFreelancer &&
                        column.id === 'approved' && (
                          <div style={s.approvedClient}>
                            <div style={s.approvedTitle}>
                              <span>✓</span>
                              Entrega aprovada
                            </div>

                            <p style={s.approvedText}>
                              O pagamento deste marco está disponível abaixo.
                            </p>
                          </div>
                        )}

                      {!isFreelancer &&
                        column.id === 'pending' && (
                          <div style={s.clientInfo}>
                            Aguardando início do freelancer.
                          </div>
                        )}

                      {!isFreelancer &&
                        column.id === 'in_progress' && (
                          <div style={s.clientInfo}>
                            O freelancer está trabalhando nesta etapa.
                          </div>
                        )}

                      {renderPaymentArea(item)}
                    </article>
                  );
                })}

                {cards.length === 0 && (
                  <div style={s.emptyColumn}>
                    <span style={s.emptyColumnIcon}>
                      ○
                    </span>

                    <span>
                      Nenhuma etapa
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const s = {
  wrapper: {
    width: '100%',
    marginTop: '20px',
    color: '#fff'
  },

  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '18px',
    flexWrap: 'wrap'
  },

  boardTitle: {
    margin: 0,
    color: '#f5f5f5',
    fontSize: '17px',
    fontWeight: '700'
  },

  boardSubtitle: {
    margin: '5px 0 0',
    color: '#777',
    fontSize: '12px'
  },

  refreshButton: {
    padding: '8px 12px',
    color: '#ccc',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600'
  },

  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: '22px',
    padding: '18px',
    marginBottom: '20px',
    backgroundColor: '#151515',
    border: '1px solid #292929',
    borderRadius: '9px',
    flexWrap: 'wrap'
  },

  summaryMain: {
    flex: '1 1 230px',
    minWidth: '190px'
  },

  summaryNumbers: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },

  summaryLabel: {
    color: '#aaa',
    fontSize: '12px',
    fontWeight: '600'
  },

  percentage: {
    color: '#ff6b00',
    fontSize: '19px'
  },

  progressTrack: {
    width: '100%',
    height: '7px',
    overflow: 'hidden',
    backgroundColor: '#303030',
    borderRadius: '10px'
  },

  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #ff6b00, #ff9a42)',
    borderRadius: '10px',
    transition: 'width 0.3s ease'
  },

  progressCaption: {
    display: 'block',
    marginTop: '7px',
    color: '#777',
    fontSize: '11px'
  },

  summaryMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    minWidth: '115px'
  },

  metricLabel: {
    color: '#777',
    fontSize: '11px'
  },

  metricValue: {
    color: '#eee',
    fontSize: '14px'
  },

  reviewBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    marginBottom: '18px',
    backgroundColor: '#f5a62312',
    border: '1px solid #f5a62345',
    borderRadius: '8px',
    color: '#f5a623'
  },

  reviewIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    flexShrink: 0,
    borderRadius: '50%',
    backgroundColor: '#f5a62322',
    fontWeight: '800'
  },

  completedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    marginBottom: '18px',
    backgroundColor: '#00c85112',
    border: '1px solid #00c85145',
    borderRadius: '8px',
    color: '#00c851'
  },

  completedIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    flexShrink: 0,
    borderRadius: '50%',
    backgroundColor: '#00c85122',
    fontWeight: '800'
  },

  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(220px, 1fr))',
    gap: '13px',
    overflowX: 'auto',
    paddingBottom: '10px',
    alignItems: 'start'
  },

  column: {
    minWidth: '220px',
    minHeight: '320px',
    padding: '12px',
    backgroundColor: '#121212',
    border: '1px solid #292929',
    borderRadius: '9px'
  },

  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    padding: '3px 2px 13px',
    marginBottom: '11px',
    borderBottom: '1px solid #292929'
  },

  columnHeading: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    minWidth: 0
  },

  columnDot: {
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    flexShrink: 0
  },

  columnTitle: {
    margin: 0,
    color: '#eee',
    fontSize: '13px',
    fontWeight: '700'
  },

  columnDescription: {
    margin: '4px 0 0',
    color: '#666',
    fontSize: '10px'
  },

  count: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '23px',
    height: '23px',
    padding: '0 6px',
    border: '1px solid',
    borderRadius: '7px',
    fontSize: '11px',
    fontWeight: '700'
  },

  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },

  card: {
    padding: '13px',
    backgroundColor: '#1b1b1b',
    border: '1px solid #303030',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '9px',
    minWidth: 0
  },

  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '7px',
    flexWrap: 'wrap'
  },

  cardNumber: {
    color: '#666',
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '0.7px'
  },

  cardStatus: {
    padding: '3px 7px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: '700'
  },

  cardTitle: {
    margin: 0,
    color: '#f3f3f3',
    fontSize: '13px',
    lineHeight: '1.4'
  },

  cardDescription: {
    margin: 0,
    color: '#929292',
    fontSize: '11px',
    lineHeight: '1.55'
  },

  noDescription: {
    margin: 0,
    color: '#555',
    fontSize: '11px',
    fontStyle: 'italic'
  },

  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    paddingTop: '9px',
    borderTop: '1px solid #303030'
  },

  amountLabel: {
    color: '#777',
    fontSize: '10px'
  },

  amount: {
    color: '#00c851',
    fontSize: '12px',
    whiteSpace: 'nowrap'
  },

  actions: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    paddingTop: '9px',
    borderTop: '1px solid #303030'
  },

  primaryAction: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '9px 10px',
    color: '#fff',
    backgroundColor: '#ff6b00',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '700'
  },

  backAction: {
    flex: '1 1 65px',
    padding: '8px 7px',
    color: '#aaa',
    backgroundColor: '#292929',
    border: '1px solid #3a3a3a',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '600'
  },

  completeAction: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '5px',
    flex: '2 1 120px',
    padding: '8px 9px',
    color: '#fff',
    backgroundColor: '#00a847',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '700'
  },

  reviewWaiting: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    width: '100%',
    color: '#f5a623',
    fontSize: '10px',
    fontWeight: '600'
  },

  approvedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    width: '100%',
    color: '#00c851',
    fontSize: '10px',
    fontWeight: '600'
  },

  clientReview: {
    paddingTop: '9px',
    borderTop: '1px solid #303030'
  },

  reviewTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#f5a623',
    fontSize: '11px',
    fontWeight: '700'
  },

  reviewText: {
    margin: '7px 0 10px',
    color: '#999',
    fontSize: '10px',
    lineHeight: '1.5'
  },

  reviewActions: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },

  rejectAction: {
    flex: '1 1 100px',
    padding: '8px 7px',
    color: '#ff9999',
    backgroundColor: '#381919',
    border: '1px solid #733333',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '600'
  },

  approveAction: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '5px',
    flex: '1 1 120px',
    padding: '8px 8px',
    color: '#fff',
    backgroundColor: '#00a847',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '700'
  },

  approvedClient: {
    paddingTop: '9px',
    borderTop: '1px solid #303030'
  },

  approvedTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#00c851',
    fontSize: '11px',
    fontWeight: '700'
  },

  approvedText: {
    margin: '7px 0 0',
    color: '#888',
    fontSize: '10px',
    lineHeight: '1.5'
  },

  clientInfo: {
    paddingTop: '8px',
    borderTop: '1px solid #303030',
    color: '#666',
    fontSize: '10px'
  },

  payBox: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#102015',
    border: '1px solid #00c85155',
    borderRadius: '7px'
  },

  payTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#00c851',
    fontSize: '11px',
    fontWeight: '700'
  },

  payText: {
    margin: '7px 0',
    color: '#aaa',
    fontSize: '10px',
    lineHeight: '1.5'
  },

  payButton: {
    width: '100%',
    marginTop: '5px',
    padding: '9px',
    backgroundColor: '#ff6b00',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '700'
  },

  receiveBox: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#15120f',
    border: '1px solid #ff6b0055',
    borderRadius: '7px'
  },

  receiveTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#ff9a42',
    fontSize: '11px',
    fontWeight: '700'
  },

  receiveText: {
    margin: '7px 0 0',
    color: '#aaa',
    fontSize: '10px',
    lineHeight: '1.5'
  },

  paidBox: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#0d1a12',
    border: '1px solid #00c85155',
    borderRadius: '7px'
  },

  paidTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#00c851',
    fontSize: '11px',
    fontWeight: '700'
  },

  paidText: {
    margin: '7px 0 0',
    color: '#888',
    fontSize: '10px'
  },

  pendingPaymentBox: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#151515',
    border: '1px solid #f5a62355',
    borderRadius: '7px'
  },

  pendingPaymentTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#f5a623',
    fontSize: '11px',
    fontWeight: '700'
  },

  pendingPaymentText: {
    margin: '7px 0 0',
    color: '#888',
    fontSize: '10px'
  },

  stateContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '11px',
    minHeight: '150px',
    color: '#aaa'
  },

  loader: {
    width: '17px',
    height: '17px',
    border: '2px solid #444',
    borderTopColor: '#ff6b00',
    borderRadius: '50%'
  },

  stateText: {
    fontSize: '13px'
  },

  errorBox: {
    display: 'flex',
    gap: '13px',
    padding: '18px',
    backgroundColor: '#2a1515',
    border: '1px solid #743333',
    borderRadius: '8px'
  },

  errorIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '25px',
    height: '25px',
    flexShrink: 0,
    borderRadius: '50%',
    backgroundColor: '#ff555522',
    color: '#ff7777',
    fontWeight: '800'
  },

  errorTitle: {
    color: '#ff9999',
    fontSize: '13px'
  },

  errorText: {
    margin: '5px 0 10px',
    color: '#c18b8b',
    fontSize: '12px'
  },

  retryButton: {
    padding: '7px 11px',
    color: '#fff',
    backgroundColor: '#8b3333',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '11px'
  },

  inlineError: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    marginBottom: '13px',
    color: '#ff9999',
    backgroundColor: '#381919',
    border: '1px solid #733333',
    borderRadius: '6px',
    fontSize: '12px'
  },

  dismissError: {
    color: '#ff9999',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px'
  },

  emptyState: {
    padding: '35px 20px',
    textAlign: 'center',
    backgroundColor: '#151515',
    border: '1px dashed #333',
    borderRadius: '9px'
  },

  emptyIcon: {
    color: '#ff6b00',
    fontSize: '30px',
    marginBottom: '10px'
  },

  emptyTitle: {
    margin: '0 0 7px',
    color: '#eee',
    fontSize: '15px'
  },

  emptyText: {
    margin: 0,
    color: '#777',
    fontSize: '12px'
  },

  emptyColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minHeight: '105px',
    color: '#555',
    fontSize: '11px',
    border: '1px dashed #303030',
    borderRadius: '7px'
  },

  emptyColumnIcon: {
    color: '#444',
    fontSize: '21px'
  }
};