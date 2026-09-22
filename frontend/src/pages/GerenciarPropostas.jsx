import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function GerenciarPropostas() {
  const { projectId } = useParams();

  const [proposals, setProposals] = useState([]);
  const [payment, setPayment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [accepting, setAccepting] = useState(null);

  async function loadProposals() {
    try {
      const response = await api.get(
        `/propostas/projeto/${projectId}`
      );

      setProposals(response.data);

    } catch (error) {
      console.error(
        'Erro ao buscar candidaturas:',
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPayment() {
    try {
      const response = await api.get(
        `/payments/projeto/${projectId}`
      );

      setPayment(response.data);

    } catch (error) {
      console.error(
        'Erro ao buscar pagamento:',
        error
      );

      setPayment(null);

    } finally {
      setLoadingPayment(false);
    }
  }

  useEffect(() => {
    if (!projectId) return;

    loadProposals();
    loadPayment();
  }, [projectId]);


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

      // Atualiza as propostas
      await loadProposals();

      // Verifica se já existe pagamento
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


  if (loading) {
    return (
      <p style={{ color: '#aaa' }}>
        Carregando propostas...
      </p>
    );
  }


  /*
   * Verifica se existe uma proposta aceita.
   */
  const acceptedProposal = proposals.find(
    (proposal) =>
      proposal.status === 'accepted'
  );


  /*
   * Verifica o status do pagamento.
   */
  const paymentPaid =
    payment?.status === 'paid';

  const paymentPending =
    payment?.status === 'pending';


  return (
    <div style={styles.container}>

      <h3 style={styles.title}>
        Candidatos & Propostas Recebidas
      </h3>


      {/* ==================================================
          PAGAMENTO CONFIRMADO
      ================================================== */}

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


      {/* ==================================================
          PAGAMENTO PENDENTE
      ================================================== */}

      {acceptedProposal &&
        !loadingPayment &&
        paymentPending && (
          <div style={styles.paymentPending}>

            <div>
              <h3 style={styles.paymentPendingTitle}>
                Contrato fechado!
              </h3>

              <p style={styles.paymentPendingText}>
                O contrato foi fechado, mas o pagamento
                ainda está aguardando confirmação.
              </p>
            </div>

            <div style={styles.pendingBadge}>
              Aguardando pagamento
            </div>

          </div>
        )}


      {/* ==================================================
          NENHUM PAGAMENTO REGISTRADO
      ================================================== */}

      {acceptedProposal &&
        !loadingPayment &&
        !payment && (
          <div style={styles.paymentPending}>

            <div>
              <h3 style={styles.paymentPendingTitle}>
                Contrato fechado!
              </h3>

              <p style={styles.paymentPendingText}>
                Para liberar o projeto, realize o
                pagamento em escrow.
              </p>
            </div>

            <div style={styles.pendingBadge}>
              Pagamento pendente
            </div>

          </div>
        )}


      {/* ==================================================
          LISTA DE PROPOSTAS
      ================================================== */}

      {proposals.length === 0 ? (

        <p style={styles.noData}>
          Nenhuma proposta recebida até o momento.
        </p>

      ) : (

        <div style={styles.list}>

          {proposals.map((prop) => (

            <div
              key={prop.id}
              style={styles.proposalCard}
            >

              <div style={styles.cardHeader}>

                <h4 style={{ margin: 0 }}>
                  {prop.freelancer?.name}
                </h4>

                <span style={styles.priceTag}>
                  R$ {Number(prop.amount)
                    .toLocaleString('pt-BR')}
                </span>

              </div>


              {/* STATUS DA PROPOSTA */}

              {prop.status === 'accepted' && (
                <div style={styles.contractedBadge}>
                  ✓ Contratado
                </div>
              )}


              <p style={styles.text}>
                {prop.coverText}
              </p>


              <div style={styles.milestonesPreview}>

                <h5
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '12px',
                    color: '#ff6b00'
                  }}
                >
                  ETAPAS SUGERIDAS:
                </h5>

                {prop.milestones?.map(
                  (m, i) => (

                    <div
                      key={i}
                      style={styles.previewRow}
                    >

                      <span>
                        {m.title}
                      </span>

                      <strong>
                        R$ {Number(m.amount)
                          .toLocaleString('pt-BR')}
                      </strong>

                    </div>

                  )
                )}

              </div>


              {/* ==================================================
                  PROPOSTA AINDA NÃO ACEITA
              ================================================== */}

              {prop.status !== 'accepted' && (

                <button
                  disabled={accepting !== null}
                  onClick={() =>
                    handleAccept(
                      prop.id,
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
                      accepting
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
                  PROPOSTA ACEITA + PAGAMENTO PAGO
              ================================================== */}

              {prop.status === 'accepted' &&
                paymentPaid && (

                  <div style={styles.projectReady}>
                    ✓ Pagamento confirmado — projeto
                    liberado para início.
                  </div>

                )}

            </div>

          ))}

        </div>

      )}

    </div>
  );
}


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
    border: '1px solid #333',
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

  milestonesPreview: {
    backgroundColor: '#111',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '15px',
    border: '1px dashed #333'
  },

  previewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#aaa',
    marginTop: '6px'
  },

  acceptBtn: {
    backgroundColor: '#00c851',
    color: '#fff',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '4px',
    fontWeight: 'bold',
    width: '100%'
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


  // ================================================
  // PAGAMENTO CONFIRMADO
  // ================================================

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
    fontSize: '16px'
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


  // ================================================
  // PAGAMENTO PENDENTE
  // ================================================

  paymentPending: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    backgroundColor: '#101a12',
    border: '1px solid #285c35',
    borderRadius: '8px',
    padding: '18px 20px',
    marginBottom: '20px'
  },

  paymentPendingTitle: {
    color: '#00c851',
    margin: '0 0 5px',
    fontSize: '16px'
  },

  paymentPendingText: {
    color: '#aaa',
    margin: 0,
    fontSize: '13px',
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


  // ================================================
  // PROJETO LIBERADO
  // ================================================

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