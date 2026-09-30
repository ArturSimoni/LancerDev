import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';

const COLUMNS = [
  { id: 'pending', title: 'A Fazer', color: '#8b8b8b', description: 'Etapas aguardando início' },
  { id: 'in_progress', title: 'Desenvolvendo', color: '#ff6b00', description: 'Etapas em execução' },
  { id: 'review', title: 'Em Revisão', color: '#33b5e5', description: 'Aguardando aprovação' },
  { id: 'done', title: 'Concluído', color: '#00c851', description: 'Etapas aprovadas' }
];

export default function KanbanBoard({ projectId, isFreelancer, onProjectCompleted }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [moving, setMoving] = useState(null);
  const [error, setError] = useState('');

  const loadKanban = useCallback(async (showLoading = true) => {
    if (!projectId) return;

    if (showLoading) setLoading(true);
    else setRefreshing(true);

    setError('');

    try {
      const response = await api.get(`/milestones/projeto/${projectId}`);
      setMilestones(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Erro ao carregar Kanban:', err);
      setError(
        err.response?.data?.message ||
        'Não foi possível carregar os marcos deste projeto.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadKanban();
  }, [loadKanban]);

  const summary = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter(item => item.status === 'done').length;
    const totalAmount = milestones.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
    const completedAmount = milestones
      .filter(item => item.status === 'done')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalAmount,
      completedAmount,
      finished: total > 0 && completed === total
    };
  }, [milestones]);

  async function moveCard(milestoneId, newStatus) {
    setMoving(milestoneId);
    setError('');

    try {
      const response = await api.patch(`/milestones/${milestoneId}/status`, {
        status: newStatus
      });

      setMilestones(current =>
        current.map(item =>
          item.id === milestoneId
            ? { ...item, ...response.data, status: newStatus }
            : item
        )
      );

      if (response.data?.projectCompleted) {
        await loadKanban(false);
        onProjectCompleted?.();
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

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  if (loading) {
    return (
      <div style={s.stateContainer}>
        <div style={s.loader} />
        <p style={s.stateText}>Carregando quadro de etapas...</p>
      </div>
    );
  }

  if (error && milestones.length === 0) {
    return (
      <div style={s.errorBox}>
        <div style={s.errorIcon}>!</div>
        <div>
          <strong style={s.errorTitle}>Não foi possível abrir o Kanban</strong>
          <p style={s.errorText}>{error}</p>
          <button onClick={() => loadKanban()} style={s.retryButton}>
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
        <h3 style={s.emptyTitle}>Nenhuma etapa cadastrada</h3>
        <p style={s.emptyText}>
          Este projeto ainda não possui etapas para acompanhar.
        </p>
        <button
          onClick={() => loadKanban()}
          disabled={refreshing}
          style={s.refreshButton}
        >
          {refreshing ? 'Atualizando...' : 'Atualizar quadro'}
        </button>
      </div>
    );
  }

  return (
    <section style={s.wrapper}>
      <div style={s.topBar}>
        <div>
          <h3 style={s.boardTitle}>Quadro de acompanhamento</h3>
          <p style={s.boardSubtitle}>
            Acompanhe o andamento de cada etapa do projeto.
          </p>
        </div>

        <button
          onClick={() => loadKanban(false)}
          disabled={refreshing || moving !== null}
          style={{
            ...s.refreshButton,
            opacity: refreshing || moving !== null ? 0.6 : 1
          }}
        >
          <span style={s.refreshIcon}>↻</span>
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {error && (
        <div style={s.inlineError}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={s.dismissError}>
            ×
          </button>
        </div>
      )}

      <div style={s.summary}>
        <div style={s.summaryMain}>
          <div style={s.summaryNumbers}>
            <span style={s.summaryLabel}>Progresso geral</span>
            <strong style={s.percentage}>{summary.percentage}%</strong>
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
            {summary.completed} de {summary.total} etapas concluídas
          </span>
        </div>

        <div style={s.summaryDivider} />

        <div style={s.summaryMetric}>
          <span style={s.metricLabel}>Valor total</span>
          <strong style={s.metricValue}>
            {formatCurrency(summary.totalAmount)}
          </strong>
        </div>

        <div style={s.summaryMetric}>
          <span style={s.metricLabel}>Valor aprovado</span>
          <strong style={{ ...s.metricValue, color: '#00c851' }}>
            {formatCurrency(summary.completedAmount)}
          </strong>
        </div>
      </div>

      {summary.finished && (
        <div style={s.completedBanner}>
          <span style={s.completedIcon}>✓</span>
          <div>
            <strong>Todos os marcos foram concluídos!</strong>
            <p>
              O projeto está pronto para ser finalizado e avaliado pelos participantes.
            </p>
          </div>
        </div>
      )}

      <div style={s.board}>
        {COLUMNS.map(column => {
          const cards = milestones.filter(item => item.status === column.id);

          return (
            <div key={column.id} style={s.column}>
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
                    <h4 style={s.columnTitle}>{column.title}</h4>
                    <p style={s.columnDescription}>{column.description}</p>
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
                  const isMoving = moving === item.id;

                  return (
                    <article key={item.id} style={s.card}>
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

                      <h5 style={s.cardTitle}>{item.title}</h5>

                      {item.description ? (
                        <p style={s.cardDescription}>{item.description}</p>
                      ) : (
                        <p style={s.noDescription}>Sem descrição informada.</p>
                      )}

                      <div style={s.cardFooter}>
                        <span style={s.amountLabel}>Valor da etapa</span>
                        <strong style={s.amount}>
                          {formatCurrency(item.amount)}
                        </strong>
                      </div>

                      {isFreelancer && (
                        <div style={s.actions}>
                          {column.id === 'pending' && (
                            <button
                              disabled={isMoving}
                              onClick={() => moveCard(item.id, 'in_progress')}
                              style={s.primaryAction}
                            >
                              {isMoving ? 'Atualizando...' : 'Iniciar etapa'}
                              {!isMoving && <span>→</span>}
                            </button>
                          )}

                          {column.id === 'in_progress' && (
                            <>
                              <button
                                disabled={isMoving}
                                onClick={() => moveCard(item.id, 'pending')}
                                style={s.backAction}
                              >
                                Voltar
                              </button>

                              <button
                                disabled={isMoving}
                                onClick={() => moveCard(item.id, 'review')}
                                style={s.reviewAction}
                              >
                                {isMoving ? 'Enviando...' : 'Enviar para revisão'}
                                {!isMoving && <span>→</span>}
                              </button>
                            </>
                          )}

                          {column.id === 'review' && (
                            <div style={s.waitingBadge}>
                              <span>◷</span>
                              Aguardando aprovação do cliente
                            </div>
                          )}

                          {column.id === 'done' && (
                            <div style={s.doneBadge}>
                              <span>✓</span>
                              Etapa aprovada pelo cliente
                            </div>
                          )}
                        </div>
                      )}

                      {!isFreelancer && column.id === 'review' && (
                        <div style={s.actions}>
                          <button
                            disabled={isMoving}
                            onClick={() => moveCard(item.id, 'in_progress')}
                            style={s.rejectAction}
                          >
                            {isMoving ? 'Atualizando...' : 'Solicitar ajuste'}
                          </button>

                          <button
                            disabled={isMoving}
                            onClick={() => moveCard(item.id, 'done')}
                            style={s.approveAction}
                          >
                            {isMoving ? 'Aprovando...' : 'Aprovar etapa'}
                            {!isMoving && <span>✓</span>}
                          </button>
                        </div>
                      )}

                      {!isFreelancer && column.id === 'done' && (
                        <div style={s.doneBadge}>
                          <span>✓</span>
                          Aprovado por você
                        </div>
                      )}

                      {!isFreelancer && column.id !== 'review' && column.id !== 'done' && (
                        <div style={s.clientInfo}>
                          Aguardando atualização do freelancer
                        </div>
                      )}
                    </article>
                  );
                })}

                {cards.length === 0 && (
                  <div style={s.emptyColumn}>
                    <span style={s.emptyColumnIcon}>○</span>
                    <span>Nenhuma etapa</span>
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
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '8px 12px',
    color: '#ccc',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600'
  },
  refreshIcon: {
    fontSize: '17px',
    lineHeight: 1
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
  summaryDivider: {
    width: '1px',
    height: '48px',
    backgroundColor: '#303030'
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
    gridTemplateColumns: 'repeat(4, minmax(230px, 1fr))',
    gap: '13px',
    overflowX: 'auto',
    paddingBottom: '10px',
    alignItems: 'start'
  },
  column: {
    minWidth: '230px',
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
    lineHeight: '1.4',
    overflowWrap: 'anywhere'
  },
  cardDescription: {
    margin: 0,
    color: '#929292',
    fontSize: '11px',
    lineHeight: '1.55',
    overflowWrap: 'anywhere'
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
    marginTop: '2px',
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
  reviewAction: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '5px',
    flex: '2 1 120px',
    padding: '8px 9px',
    color: '#fff',
    backgroundColor: '#238db4',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '700'
  },
  rejectAction: {
    flex: '1 1 90px',
    padding: '8px 6px',
    color: '#ff7777',
    backgroundColor: '#ff555510',
    border: '1px solid #ff555555',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '700'
  },
  approveAction: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '5px',
    flex: '1 1 100px',
    padding: '8px 7px',
    color: '#fff',
    backgroundColor: '#00a847',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '700'
  },
  waitingBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    width: '100%',
    color: '#33b5e5',
    fontSize: '10px',
    lineHeight: '1.4'
  },
  doneBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    width: '100%',
    color: '#00c851',
    fontSize: '10px',
    fontWeight: '600'
  },
  clientInfo: {
    paddingTop: '8px',
    borderTop: '1px solid #303030',
    color: '#666',
    fontSize: '10px',
    lineHeight: '1.4'
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
    margin: '0 0 15px',
    color: '#777',
    fontSize: '12px'
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
    borderRadius: '50%',
    animation: 'lancerKanbanSpin 0.8s linear infinite'
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
  }
};