import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function VerPropostas() {
  const { projectId } = useParams();

  const [proposals, setProposals] = useState([]);
  const [payment, setPayment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // ============================================================
  // BUSCAR PROPOSTAS
  // ============================================================

  async function loadProposals() {
    try {
      const response = await api.get(
        `/propostas/projeto/${projectId}`
      );

      setProposals(response.data);

    } catch (error) {
      console.error(
        'Erro ao buscar propostas:',
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // BUSCAR PAGAMENTO
  // ============================================================

  async function loadPayment() {
    try {
      const response = await api.get(
        `/payments/projeto/${projectId}`
      );

      setPayment(response.data);

      return response.data;

    } catch (error) {
      console.error(
        'Erro ao buscar pagamento:',
        error
      );

      setPayment(null);

      return null;

    } finally {
      setLoadingPayment(false);
    }
  }

  // ============================================================
  // CARREGAMENTO INICIAL
  // ============================================================

  useEffect(() => {
    if (!projectId) return;

    loadProposals();
    loadPayment();
  }, [projectId]);

  // ============================================================
  // VERIFICAR PAGAMENTO AUTOMATICAMENTE
  //
  // Isso é importante porque o Mercado Pago pode aprovar
  // o pagamento antes do webhook atualizar o banco.
  // ============================================================

  useEffect(() => {
    if (!projectId) return;

    let attempts = 0;
    let interval = null;

    async function checkPayment() {
      try {
        const response = await api.get(
          `/payments/projeto/${projectId}`
        );

        const currentPayment = response.data;

        setPayment(currentPayment);
        setLoadingPayment(false);

        attempts++;

        // Pagamento confirmado
        if (currentPayment?.status === 'paid') {
          if (interval) {
            clearInterval(interval);
          }

          return;
        }

        // Depois de 30 segundos para de consultar
        // 15 tentativas x 2 segundos
        if (attempts >= 15) {
          if (interval) {
            clearInterval(interval);
          }
        }

      } catch (error) {
        console.error(
          'Erro ao verificar pagamento:',
          error
        );

        attempts++;

        if (attempts >= 15 && interval) {
          clearInterval(interval);
        }
      }
    }

    // Consulta imediatamente
    checkPayment();

    // Depois consulta a cada 2 segundos
    interval = setInterval(
      checkPayment,
      2000
    );

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };

  }, [projectId]);

  // ============================================================
  // ACEITAR PROPOSTA
  // ============================================================

  async function handleAccept(
    proposalId,
    proposalMilestones
  ) {
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

      alert(
        'Contrato fechado com sucesso!'
      );

      await loadProposals();
      await loadPayment();

    } catch (error) {
      console.error(
        'Erro ao aprovar proposta:',
        error
      );

      alert(
        error.response?.data?.message ||
        'Falha ao aceitar proposta.'
      );

    } finally {
      setAccepting(null);
    }
  }

  // ============================================================
  // PAGAMENTO
  // ============================================================

  async function handlePagar() {
    setPaymentLoading(true);

    try {
      const response = await api.post(
        '/payments/criar',
        {
          projectId: Number(projectId)
        }
      );

      // Preferência de sandbox do Mercado Pago
      window.location.href =
        response.data.sandboxInitPoint;

    } catch (error) {
      console.error(
        'Erro ao iniciar pagamento:',
        error
      );

      alert(
        error.response?.data?.message ||
        'Erro ao iniciar pagamento.'
      );

      setPaymentLoading(false);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: '#aaa' }}>
          Carregando propostas...
        </p>
      </div>
    );
  }

  // ============================================================
  // STATUS
  // ============================================================

  const acceptedProposal = proposals.find(
    proposal =>
      proposal.status === 'accepted'
  );

  const paymentPaid =
    payment?.status === 'paid';

  const paymentPending =
    payment?.status === 'pending';

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div style={styles.container}>

      <h3 style={styles.title}>
        Candidatos & Propostas Recebidas
      </h3>

      {/* ========================================================
          PAGAMENTO CONFIRMADO
      ======================================================== */}

      {acceptedProposal && paymentPaid && (

        <div style={styles.paymentSuccess}>

          <div style={styles.paymentIcon}>
            ✓
          </div>

          <div style={styles.paymentContent}>

            <h3 style={styles.paymentSuccessTitle}>
              Pagamento confirmado!
            </h3>

            <p style={styles.paymentSuccessText}>
              O pagamento foi recebido com sucesso.
              O projeto está pronto para ser iniciado.
            </p>

          </div>

          <div style={styles.paidBadge}>
            ✓ Pago
          </div>

        </div>

      )}

      {/* ========================================================
          PAGAMENTO PENDENTE
      ======================================================== */}

      {acceptedProposal &&
        !loadingPayment &&
        !paymentPaid &&
        (paymentPending || !payment) && (

        <div style={styles.paymentPending}>

          <div style={styles.paymentContent}>

            <h3 style={styles.paymentPendingTitle}>
              Contrato fechado!
            </h3>

            <p style={styles.paymentPendingText}>
              Para liberar o Kanban e iniciar o
              projeto, realize o pagamento em escrow.
              O valor ficará retido até a aprovação
              de cada marco.
            </p>

          </div>

          <button
            onClick={handlePagar}
            disabled={paymentLoading}
            style={{
              ...styles.btnPagar,
              opacity: paymentLoading
                ? 0.7
                : 1,
              cursor: paymentLoading
                ? 'not-allowed'
                : 'pointer'
            }}
          >
            {paymentLoading
              ? 'Redirecionando...'
              : '💳 Pagar com Mercado Pago'}
          </button>

        </div>

      )}

      {/* ========================================================
          CARREGANDO STATUS DO PAGAMENTO
      ======================================================== */}

      {acceptedProposal &&
        loadingPayment && (

        <div style={styles.paymentChecking}>

          <span>
            Verificando status do pagamento...
          </span>

        </div>

      )}

      {/* ========================================================
          LISTA DE PROPOSTAS
      ======================================================== */}

      {proposals.length === 0 ? (

        <p style={styles.noData}>
          Nenhuma proposta recebida até o momento.
        </p>

      ) : (

        <div style={styles.list}>

          {proposals.map((prop) => (

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

              {/* HEADER */}

              <div style={styles.cardHeader}>

                <h4 style={{ margin: 0 }}>
                  {prop.freelancer?.name}
                </h4>

                <span style={styles.priceTag}>
                  R$ {Number(prop.amount)
                    .toLocaleString('pt-BR')}
                </span>

              </div>

              {/* STATUS */}

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

              {/* DESCRIÇÃO */}

              <p style={styles.text}>
                {prop.coverText}
              </p>

              {/* ==================================================
                  ETAPAS
              ================================================== */}

              <div style={styles.milestonesPreview}>

                <h5 style={styles.milestonesTitle}>
                  <span>
                    ETAPAS PROPOSTAS
                  </span>

                  <span style={styles.milestoneTotal}>
                    Total: R${' '}
                    {(
                      Array.isArray(prop.milestonesData)
                        ? prop.milestonesData
                        : Array.isArray(prop.milestones)
                          ? prop.milestones
                          : []
                    )
                      .reduce(
                        (total, milestone) =>
                          total +
                          Number(milestone.amount),
                        0
                      )
                      .toLocaleString('pt-BR')}
                  </span>
                </h5>

                {(
                  Array.isArray(prop.milestonesData)
                    ? prop.milestonesData
                    : Array.isArray(prop.milestones)
                      ? prop.milestones
                      : []
                ).map((milestone, index) => (

                  <div
                    key={index}
                    style={styles.previewRow}
                  >

                    <span>
                      {index + 1}. {milestone.title}
                    </span>

                    <strong>
                      R${' '}
                      {Number(milestone.amount)
                        .toLocaleString('pt-BR')}
                    </strong>

                  </div>

                ))}

              </div>

              {/* ==================================================
                  ACEITAR PROPOSTA
              ================================================== */}

              {prop.status === 'pending' && (

                <button
                  disabled={
                    accepting !== null ||
                    acceptedProposal !== undefined
                  }
                  onClick={() =>
                    handleAccept(
                      prop.id,
                      prop.milestonesData ||
                      prop.milestones
                    )
                  }
                  style={{
                    ...styles.acceptBtn,

                    opacity:
                      accepting === prop.id
                        ? 0.6
                        : 1,

                    cursor:
                      accepting !== null ||
                      acceptedProposal
                        ? 'not-allowed'
                        : 'pointer'
                  }}
                >

                  {accepting === prop.id
                    ? 'Processando...'
                    : '🤝 Aceitar Proposta'}

                </button>

              )}

              {/* ==================================================
                  PROJETO LIBERADO
              ================================================== */}

              {prop.status === 'accepted' &&
                paymentPaid && (

                <div style={styles.projectReady}>
                  ✓ Pagamento confirmado —
                  projeto liberado para início.
                </div>

              )}

            </div>

          ))}

        </div>

      )}

    </div>
  );
}

// ================================================================
// ESTILOS
// ================================================================

const styles = {

  container: {
    marginTop: '20px',
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
    marginBottom: '10px'
  },

  priceTag: {
    color: '#00c851',
    fontWeight: 'bold',
    fontSize: '18px'
  },

  text: {
    color: '#ccc',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 15px 0'
  },

  /* ============================================================
     STATUS
  ============================================================ */

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

  /* ============================================================
     ETAPAS
  ============================================================ */

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
    justifyContent: 'space-between'
  },

  milestoneTotal: {
    color: '#00c851',
    fontWeight: 'bold'
  },

  previewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#aaa',
    marginTop: '6px',
    padding: '4px 0',
    borderBottom: '1px solid #1a1a1a'
  },

  /* ============================================================
     BOTÃO ACEITAR
  ============================================================ */

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

  /* ============================================================
     PAGAMENTO CONFIRMADO
  ============================================================ */

  paymentSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: '#061f0d',
    border: '1px solid #006b2b',
    borderRadius: '8px',
    padding: '18px 20px',
    marginBottom: '20px'
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
    flex: 1
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

  /* ============================================================
     PAGAMENTO PENDENTE
  ============================================================ */

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

  pendingBadge: {
    backgroundColor: '#2b2b2b',
    color: '#aaa',
    padding: '7px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },

  /* ============================================================
     BOTÃO MERCADO PAGO
  ============================================================ */

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

  /* ============================================================
     VERIFICANDO PAGAMENTO
  ============================================================ */

  paymentChecking: {
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '15px 20px',
    marginBottom: '20px',
    color: '#aaa',
    fontSize: '13px'
  },

  /* ============================================================
     PROJETO LIBERADO
  ============================================================ */

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