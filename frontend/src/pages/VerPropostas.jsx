
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

export default function VerPropostas() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [proposals, setProposals] = useState([]);
  const [payment, setPayment] = useState(null);
  const [canPay, setCanPay] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const loadProposals = useCallback(async () => {
    try {
      const response = await api.get(
        `/propostas/projeto/${projectId}`
      );

      setProposals(response.data);
    } catch (error) {
      console.error('Erro ao buscar propostas:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadPayment = useCallback(async () => {
    try {
      const response = await api.get(
        `/payments/projeto/${projectId}`
      );

      const result = response.data;

      setPayment(result.payment);
      setCanPay(result.canPay);

      return result.payment;
    } catch (error) {
      console.error('Erro ao buscar pagamento:', error);
      setPayment(null);
      setCanPay(false);
      return null;
    } finally {
      setLoadingPayment(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    loadProposals();
    loadPayment();
  }, [projectId, loadProposals, loadPayment]);

  useEffect(() => {
    if (!projectId) return;

    let attempts = 0;
    let interval = null;
    let active = true;

    async function checkPayment() {
      try {
        const response = await api.get(
          `/payments/projeto/${projectId}`
        );

        if (!active) return;

        const result = response.data;
        const currentPayment = result.payment;

        setPayment(currentPayment);
        setCanPay(result.canPay);
        setLoadingPayment(false);

        attempts++;

        if (
          currentPayment?.status === 'paid' ||
          attempts >= 15
        ) {
          if (interval) clearInterval(interval);
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);

        attempts++;

        if (attempts >= 15 && interval) {
          clearInterval(interval);
        }
      }
    }

    checkPayment();
    interval = setInterval(checkPayment, 2000);

    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [projectId]);

  async function handleAccept(proposalId, proposalMilestones) {
    if (
      !window.confirm(
        'Deseja fechar contrato com este desenvolvedor?'
      )
    ) {
      return;
    }

    setAccepting(proposalId);

    try {
      await api.post(
        `/propostas/${proposalId}/accept`,
        {
          milestones: proposalMilestones
        }
      );

      alert('Contrato fechado com sucesso!');

      await loadProposals();
      await loadPayment();
    } catch (error) {
      console.error('Erro ao aprovar proposta:', error);

      alert(
        error.response?.data?.message ||
        'Falha ao aceitar proposta.'
      );
    } finally {
      setAccepting(null);
    }
  }

  async function handlePagar() {
    if (!canPay || paymentLoading) return;

    setPaymentLoading(true);

    try {
      const response = await api.post(
        '/payments/criar',
        {
          projectId: Number(projectId)
        }
      );

      const checkoutUrl =
        response.data.sandboxInitPoint ||
        response.data.initPoint;

      if (!checkoutUrl) {
        throw new Error(
          'O Mercado Pago não retornou um endereço de pagamento.'
        );
      }

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Erro ao iniciar pagamento:', error);

      alert(
        error.response?.data?.message ||
        error.message ||
        'Erro ao iniciar pagamento.'
      );

      setPaymentLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: '#aaa' }}>
          Carregando propostas...
        </p>
      </div>
    );
  }

  const acceptedProposal = proposals.find(
    proposal => proposal.status === 'accepted'
  );

  const paymentPaid = payment?.status === 'paid';
  const paymentPending = payment?.status === 'pending';

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>
        Candidatos & Propostas Recebidas
      </h3>

      {acceptedProposal && loadingPayment && (
        <div style={styles.paymentChecking}>
          Verificando status do pagamento...
        </div>
      )}

      {acceptedProposal && paymentPaid && (
        <div style={styles.paymentSuccess}>
          <div style={styles.paymentIcon}>✓</div>

          <div style={styles.paymentContent}>
            <h3 style={styles.paymentSuccessTitle}>
              Pagamento confirmado!
            </h3>

            <p style={styles.paymentSuccessText}>
              O pagamento foi confirmado pelo Mercado Pago.
              O projeto está pronto para ser iniciado.
            </p>
          </div>

          <div style={styles.paidBadge}>
            ✓ Pago
          </div>
        </div>
      )}

      {acceptedProposal &&
        canPay &&
        !loadingPayment &&
        !paymentPaid &&
        (paymentPending || !payment) && (
          <div style={styles.paymentPending}>
            <div style={styles.paymentContent}>
              <h3 style={styles.paymentPendingTitle}>
                Contrato fechado!
              </h3>

              <p style={styles.paymentPendingText}>
                Para iniciar o projeto, realize o pagamento
                pelo Mercado Pago.
              </p>

              {paymentPending && (
                <p style={styles.paymentPendingInfo}>
                  Existe um pagamento aguardando confirmação.
                </p>
              )}
            </div>

            <button
              onClick={handlePagar}
              disabled={paymentLoading}
              style={{
                ...styles.btnPagar,
                opacity: paymentLoading ? 0.7 : 1,
                cursor: paymentLoading
                  ? 'not-allowed'
                  : 'pointer'
              }}
            >
              {paymentLoading
                ? 'Redirecionando...'
                : 'Pagar com Mercado Pago'}
            </button>
          </div>
        )}

      {acceptedProposal &&
        !canPay &&
        !loadingPayment &&
        !paymentPaid && (
          <div style={styles.paymentWaiting}>
            <div style={styles.waitingIcon}>⌛</div>

            <div style={styles.paymentContent}>
              <h3 style={styles.waitingTitle}>
                Aguardando pagamento
              </h3>

              <p style={styles.paymentPendingText}>
                O cliente precisa concluir o pagamento
                pelo Mercado Pago para iniciar o projeto.
              </p>
            </div>

            <span style={styles.pendingBadge}>
              Pendente
            </span>
          </div>
        )}

      {proposals.length === 0 ? (
        <p style={styles.noData}>
          Nenhuma proposta recebida até o momento.
        </p>
      ) : (
        <div style={styles.list}>
          {proposals.map(prop => {
            const milestones = Array.isArray(prop.milestonesData)
              ? prop.milestonesData
              : Array.isArray(prop.milestones)
                ? prop.milestones
                : [];

            const milestoneTotal = milestones.reduce(
              (total, milestone) =>
                total + Number(milestone.amount || 0),
              0
            );

            return (
              <div
                key={prop.id}
                style={{
                  ...styles.proposalCard,
                  borderColor:
                    prop.status === 'accepted'
                      ? '#00c85140'
                      : '#333'
                }}
              >
                <div style={styles.cardHeader}>
                  <h4 style={{ margin: 0 }}>
                    {prop.freelancer?.name}
                  </h4>

                  <span style={styles.priceTag}>
                    R${' '}
                    {Number(prop.amount).toLocaleString('pt-BR')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (prop.freelancer?.id) {
                      navigate(`/perfil/${prop.freelancer.id}`);
                    }
                  }}
                  disabled={!prop.freelancer?.id}
                  style={{
                    ...styles.profileBtn,
                    opacity: prop.freelancer?.id ? 1 : 0.5,
                    cursor: prop.freelancer?.id ? 'pointer' : 'not-allowed'
                  }}
                >
                  Ver perfil do freelancer
                </button>

                {prop.status === 'accepted' && (
                  <div style={styles.contractedBadge}>
                    ✓ Contratado
                  </div>
                )}

                {prop.status === 'rejected' && (
                  <div style={styles.rejectedBadge}>
                    ✕ Recusado
                  </div>
                )}

                {prop.status === 'pending' && (
                  <div style={styles.pendingProposalBadge}>
                    Pendente
                  </div>
                )}

                <p style={styles.text}>
                  {prop.coverText}
                </p>

                <div style={styles.milestonesPreview}>
                  <h5 style={styles.milestonesTitle}>
                    <span>ETAPAS PROPOSTAS</span>

                    <span style={styles.milestoneTotal}>
                      Total: R${' '}
                      {milestoneTotal.toLocaleString('pt-BR')}
                    </span>
                  </h5>

                  {milestones.length === 0 ? (
                    <p style={styles.noMilestones}>
                      Nenhuma etapa informada.
                    </p>
                  ) : (
                    milestones.map((milestone, index) => (
                      <div
                        key={index}
                        style={styles.previewCard}
                      >
                        <div style={styles.previewRow}>
                          <strong>
                            {index + 1}. {milestone.title}
                          </strong>

                          <strong style={styles.milestoneAmount}>
                            R${' '}
                            {Number(milestone.amount || 0).toLocaleString('pt-BR')}
                          </strong>
                        </div>

                        <p style={styles.milestoneDescription}>
                          {milestone.description?.trim()
                            ? milestone.description
                            : 'Nenhuma descrição informada para esta etapa.'}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {prop.status === 'pending' && (
                  <button
                    disabled={
                      accepting !== null ||
                      acceptedProposal !== undefined
                    }
                    onClick={() =>
                      handleAccept(
                        prop.id,
                        prop.milestonesData || prop.milestones
                      )
                    }
                    style={{
                      ...styles.acceptBtn,
                      opacity:
                        accepting === prop.id ? 0.6 : 1,
                      cursor:
                        accepting !== null ||
                        acceptedProposal
                          ? 'not-allowed'
                          : 'pointer'
                    }}
                  >
                    {accepting === prop.id
                      ? 'Processando...'
                      : 'Aceitar Proposta'}
                  </button>
                )}

                {prop.status === 'accepted' && paymentPaid && (
                  <div style={styles.projectReady}>
                    ✓ Pagamento confirmado — projeto liberado
                    para início.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '0 20px',
    boxSizing: 'border-box',
    color: '#fff'
  },

  title: {
    fontSize: '18px',
    color: '#ff6b00',
    marginBottom: '20px'
  },

  noData: {
    color: '#666',
    fontStyle: 'italic'
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },

  proposalCard: {
    position: 'relative',
    backgroundColor: '#1e1e1e',
    border: '1px solid',
    borderRadius: '8px',
    padding: '20px'
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    gap: '12px'
  },

  priceTag: {
    color: '#00c851',
    fontWeight: 'bold',
    fontSize: '18px'
  },

  profileBtn: {
    backgroundColor: '#292929',
    color: '#ff8a35',
    border: '1px solid #ff6b00',
    padding: '9px 14px',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '13px',
    marginBottom: '14px'
  },

  text: {
    color: '#ccc',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 15px 0'
  },

  contractedBadge: {
    display: 'inline-block',
    backgroundColor: '#063d1c',
    color: '#00c851',
    padding: '5px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },

  rejectedBadge: {
    display: 'inline-block',
    backgroundColor: '#3d0b0b',
    color: '#ff5555',
    padding: '5px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },

  pendingProposalBadge: {
    display: 'inline-block',
    backgroundColor: '#2b2105',
    color: '#ffb300',
    padding: '5px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },

  milestonesPreview: {
    backgroundColor: '#111',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '15px',
    border: '1px dashed #333'
  },

  milestonesTitle: {
    color: '#ff6b00',
    fontSize: '12px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    flexWrap: 'wrap'
  },

  milestoneTotal: {
    color: '#00c851',
    fontWeight: 'bold'
  },

  previewCard: {
    padding: '10px 0',
    borderBottom: '1px solid #252525'
  },

  previewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    fontSize: '13px',
    color: '#aaa',
    alignItems: 'flex-start'
  },

  milestoneAmount: {
    color: '#00c851',
    whiteSpace: 'nowrap'
  },

  milestoneDescription: {
    color: '#888',
    fontSize: '12px',
    lineHeight: '1.6',
    margin: '8px 0 0',
    whiteSpace: 'pre-wrap'
  },

  noMilestones: {
    color: '#777',
    fontSize: '13px',
    margin: '10px 0 0'
  },

  acceptBtn: {
    backgroundColor: '#00c851',
    color: '#fff',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '4px',
    fontWeight: 'bold',
    width: '100%',
    marginTop: '5px'
  },

  paymentSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: '#061f0d',
    border: '1px solid #006b2b',
    borderRadius: '8px',
    padding: '18px 20px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },

  paymentIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: '#00c851',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    flexShrink: 0
  },

  paymentContent: {
    flex: 1,
    minWidth: '180px'
  },

  paymentSuccessTitle: {
    color: '#00c851',
    margin: '0 0 5px',
    fontSize: '16px',
    fontWeight: 'bold'
  },

  paymentSuccessText: {
    color: '#aaa',
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.5'
  },

  paidBadge: {
    backgroundColor: '#063d1c',
    color: '#00c851',
    padding: '7px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },

  paymentPending: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    backgroundColor: '#0d1f0d',
    border: '1px solid #00c85140',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },

  paymentPendingTitle: {
    color: '#00c851',
    margin: '0 0 6px 0',
    fontSize: '16px'
  },

  paymentPendingText: {
    color: '#aaa',
    fontSize: '13px',
    margin: 0,
    lineHeight: '1.5'
  },

  paymentPendingInfo: {
    color: '#ffb300',
    fontSize: '12px',
    margin: '8px 0 0',
    lineHeight: '1.5'
  },

  paymentWaiting: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: '#211b08',
    border: '1px solid #806000',
    borderRadius: '10px',
    padding: '18px 20px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },

  waitingIcon: {
    fontSize: '24px',
    flexShrink: 0
  },

  waitingTitle: {
    color: '#ffb300',
    margin: '0 0 6px',
    fontSize: '16px'
  },

  pendingBadge: {
    backgroundColor: '#2b2105',
    color: '#ffb300',
    padding: '7px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },

  btnPagar: {
    backgroundColor: '#009ee3',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    flexShrink: 0
  },

  paymentChecking: {
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '15px 20px',
    marginBottom: '20px',
    color: '#aaa',
    fontSize: '13px'
  },

  projectReady: {
    marginTop: '15px',
    padding: '10px 12px',
    backgroundColor: '#061f0d',
    border: '1px solid #006b2b',
    borderRadius: '5px',
    color: '#00c851',
    fontSize: '13px',
    fontWeight: 'bold'
  }
};
