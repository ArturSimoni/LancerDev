import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import KanbanBoard from '../components/KanbanBoard';
import PixPaymentModal from '../components/PixPaymentModal';

function isMilestoneCompleted(status) {
  return [
    'approved',
    'done',
    'completed',
    'complete',
    'concluido',
    'concluida',
    'concluído',
    'concluída',
    'finished',
    'finalizado',
    'finalizada'
  ].includes(
    String(status || '').trim().toLowerCase()
  );
}

const PIX_TYPE_LABELS = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  phone: 'Telefone',
  random: 'Chave aleatória'
};

const PIX_PLACEHOLDERS = {
  cpf: '000.000.000-00',
  cnpj: '00.000.000/0000-00',
  email: 'voce@email.com',
  phone: '(41) 90000-0000',
  random: '00000000-0000-0000-0000-000000000000'
};

export default function Dashboard() {
  const navigate = useNavigate();

  const role =
    localStorage.getItem('@LancerDev:role');

  const user = localStorage.getItem('@LancerDev:user')
    ? JSON.parse(
        localStorage.getItem('@LancerDev:user')
      )
    : null;

  const [activeProjects, setActiveProjects] =
    useState([]);

  const [historyProjects, setHistoryProjects] =
    useState([]);

  const [pendingReviews, setPendingReviews] =
    useState([]);

  const [selectedProject, setSelectedProject] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [paymentStatus, setPaymentStatus] =
    useState({});

  const [selectedReview, setSelectedReview] =
    useState(null);

  const [rating, setRating] =
    useState(5);

  const [reviewMessage, setReviewMessage] =
    useState('');

  const [reviewLoading, setReviewLoading] =
    useState(false);

  const [pixRegistered, setPixRegistered] =
    useState(false);

  const [pixKeyType, setPixKeyType] =
    useState('cpf');

  const [pixKeyMasked, setPixKeyMasked] =
    useState('');

  const [pixKeyInput, setPixKeyInput] =
    useState('');

  const [pixEditing, setPixEditing] =
    useState(false);

  const [pixSaving, setPixSaving] =
    useState(false);

  const [pixTarget, setPixTarget] =
    useState(null);

  const [refreshKey, setRefreshKey] =
    useState(0);

  useEffect(() => {
    if (!role) {
      navigate('/login');
      return;
    }

    loadDashboard();
  }, [role]);

  async function loadDashboard() {
    setLoading(true);

    try {
      const [
        activeResponse,
        historyResponse,
        pendingResponse
      ] = await Promise.all([
        api.get('/projects/ativos'),
        api.get('/projects/historico'),
        api.get('/reviews/pendentes')
      ]);

      const active =
        Array.isArray(activeResponse.data)
          ? activeResponse.data
          : [];

      setActiveProjects(active);

      setHistoryProjects(
        Array.isArray(historyResponse.data)
          ? historyResponse.data
          : []
      );

      setPendingReviews(
        Array.isArray(pendingResponse.data)
          ? pendingResponse.data
          : []
      );

      if (role === 'freelancer') {
        try {
          const response =
            await api.get(
              '/payments/pix-key'
            );

          setPixRegistered(
            Boolean(response.data.registered)
          );

          setPixKeyType(
            response.data.pixKeyType || 'cpf'
          );

          setPixKeyMasked(
            response.data.pixKeyMasked || ''
          );
        } catch {
          setPixRegistered(false);
        }
      }

      setSelectedProject(current => {
        if (
          current &&
          active.some(
            project =>
              Number(project.id) ===
              Number(current.id)
          )
        ) {
          return active.find(
            project =>
              Number(project.id) ===
              Number(current.id)
          );
        }

        return active[0] || null;
      });

      await checkProjectPayments(active);
    } catch (error) {
      console.error(
        'Erro ao carregar dashboard:',
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function checkProjectPayments(projects) {
    const status = {};

    await Promise.all(
      projects.map(async project => {
        try {
          const [
            milestonesResponse,
            paymentsResponse
          ] = await Promise.all([
            api.get(
              `/milestones/projeto/${project.id}`
            ),
            api.get(
              `/payments/projeto/${project.id}`
            )
          ]);

          const milestones =
            Array.isArray(
              milestonesResponse.data
            )
              ? milestonesResponse.data
              : Array.isArray(
                  milestonesResponse.data
                    ?.milestones
                )
                ? milestonesResponse.data
                    .milestones
                : [];

          const payments =
            Array.isArray(
              paymentsResponse.data?.payments
            )
              ? paymentsResponse.data.payments
              : [];

          const orderedMilestones =
            milestones
              .slice()
              .sort(
                (a, b) =>
                  Number(a.id) -
                  Number(b.id)
              );

          const paidMilestoneIds =
            new Set(
              payments
                .filter(
                  payment =>
                    payment.status === 'paid'
                )
                .map(
                  payment =>
                    Number(
                      payment.milestoneId
                    )
                )
            );

          const currentMilestone =
            orderedMilestones.find(
              milestone =>
                !paidMilestoneIds.has(
                  Number(milestone.id)
                )
            ) || null;

          const currentPayment =
            currentMilestone
              ? payments
                  .slice()
                  .reverse()
                  .find(
                    payment =>
                      Number(
                        payment.milestoneId
                      ) ===
                      Number(
                        currentMilestone.id
                      )
                  ) || null
              : null;

          const completedUnpaidMilestone =
            currentMilestone &&
            isMilestoneCompleted(
              currentMilestone.status
            )
              ? currentMilestone
              : null;

          const allPaid =
            orderedMilestones.length > 0 &&
            orderedMilestones.every(
              milestone =>
                paidMilestoneIds.has(
                  Number(milestone.id)
                )
            );

          status[project.id] = {
            milestones:
              orderedMilestones,
            payments,
            currentMilestone,
            currentPayment,
            completedUnpaidMilestone,
            allPaid
          };
        } catch (error) {
          console.error(
            `Erro ao consultar pagamentos do projeto ${project.id}:`,
            error
          );

          status[project.id] = {
            milestones: [],
            payments: [],
            currentMilestone: null,
            currentPayment: null,
            completedUnpaidMilestone:
              null,
            allPaid: false
          };
        }
      })
    );

    setPaymentStatus(status);
  }

  function handlePayMilestone(
    projectId,
    milestoneId
  ) {
    const projectData =
      paymentStatus[projectId];

    if (!projectData) {
      alert(
        'Não foi possível verificar o estado do pagamento.'
      );
      return;
    }

    if (
      !projectData.currentMilestone ||
      Number(
        projectData.currentMilestone.id
      ) !== Number(milestoneId)
    ) {
      alert(
        'Os pagamentos dos marcos devem seguir a ordem do projeto.'
      );
      return;
    }

    if (
      !isMilestoneCompleted(
        projectData.currentMilestone.status
      )
    ) {
      alert(
        'Este marco ainda não foi aprovado.'
      );
      return;
    }

    if (
      projectData.currentPayment?.status ===
      'paid'
    ) {
      alert(
        'Este marco já foi pago.'
      );
      return;
    }

    setPixTarget({
      projectId: Number(projectId),
      milestoneId: Number(milestoneId)
    });
  }

  async function handleSavePixKey(event) {
    event.preventDefault();

    if (!pixKeyInput.trim()) {
      alert('Informe a chave Pix.');
      return;
    }

    try {
      setPixSaving(true);

      const response =
        await api.put(
          '/payments/pix-key',
          {
            pixKeyType,
            pixKey: pixKeyInput.trim()
          }
        );

      setPixRegistered(true);

      setPixKeyType(
        response.data.pixKeyType || pixKeyType
      );

      setPixKeyMasked(
        response.data.pixKeyMasked || ''
      );

      setPixKeyInput('');
      setPixEditing(false);
    } catch (error) {
      alert(
        error.response?.data?.message ||
        'Não foi possível salvar a chave Pix.'
      );
    } finally {
      setPixSaving(false);
    }
  }

  async function refreshLists() {
    try {
      const [
        activeResponse,
        historyResponse,
        pendingResponse
      ] = await Promise.all([
        api.get('/projects/ativos'),
        api.get('/projects/historico'),
        api.get('/reviews/pendentes')
      ]);

      const active =
        Array.isArray(activeResponse.data)
          ? activeResponse.data
          : [];

      setActiveProjects(active);

      setHistoryProjects(
        Array.isArray(historyResponse.data)
          ? historyResponse.data
          : []
      );

      setPendingReviews(
        Array.isArray(pendingResponse.data)
          ? pendingResponse.data
          : []
      );

      setSelectedProject(current => {
        if (
          current &&
          active.some(
            project =>
              Number(project.id) ===
              Number(current.id)
          )
        ) {
          return active.find(
            project =>
              Number(project.id) ===
              Number(current.id)
          );
        }

        return active[0] || null;
      });

      await checkProjectPayments(active);
    } catch (error) {
      console.error(
        'Erro ao atualizar o painel:',
        error
      );
    }
  }

  async function handlePixClosed() {
    setPixTarget(null);

    await refreshLists();

    setRefreshKey(current => current + 1);
  }

  function handleSelectProject(project) {
    setSelectedProject(project);
  }

  function handleOpenReview(review) {
    setSelectedReview(review);
    setRating(5);
    setReviewMessage('');
  }

  async function handleSubmitReview(event) {
    event.preventDefault();

    if (!selectedReview) {
      return;
    }

    setReviewLoading(true);

    try {
      await api.post('/reviews', {
        projectId:
          selectedReview.projectId,
        rating: Number(rating),
        message:
          reviewMessage.trim()
      });

      alert(
        'Avaliação enviada com sucesso!'
      );

      setSelectedReview(null);
      setRating(5);
      setReviewMessage('');

      const [
        historyResponse,
        pendingResponse
      ] = await Promise.all([
        api.get('/projects/historico'),
        api.get('/reviews/pendentes')
      ]);

      setHistoryProjects(
        Array.isArray(
          historyResponse.data
        )
          ? historyResponse.data
          : []
      );

      setPendingReviews(
        Array.isArray(
          pendingResponse.data
        )
          ? pendingResponse.data
          : []
      );
    } catch (error) {
      console.error(
        'Erro ao enviar avaliação:',
        error
      );

      alert(
        error.response?.data?.message ||
        'Não foi possível enviar a avaliação.'
      );
    } finally {
      setReviewLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        Carregando painel...
      </div>
    );
  }

  const selectedPaymentData =
    selectedProject
      ? paymentStatus[
          selectedProject.id
        ] || null
      : null;

  const selectedCurrentMilestone =
    selectedPaymentData?.currentMilestone ||
    null;

  const selectedCurrentPayment =
    selectedPaymentData?.currentPayment ||
    null;

  const selectedProjectPaid =
    Boolean(
      selectedPaymentData?.allPaid
    );

  const canPaySelectedMilestone =
    role === 'client' &&
    selectedCurrentMilestone &&
    isMilestoneCompleted(
      selectedCurrentMilestone.status
    ) &&
    selectedCurrentPayment?.status !==
      'paid';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Painel de Controle
          </h1>

          <p style={styles.subtitle}>
            Bem-vindo,{' '}
            <span style={styles.userName}>
              {user?.name}
            </span>
          </p>
        </div>

        <div style={styles.badge}>
          Perfil:{' '}
          <strong
            style={{
              color:
                role === 'freelancer'
                  ? '#00c851'
                  : '#33b5e5'
            }}
          >
            {role?.toUpperCase()}
          </strong>
        </div>
      </div>

      <div style={styles.actions}>
        {role === 'freelancer' ? (
          <>
            <button
              onClick={() =>
                navigate('/projetos')
              }
              style={styles.primaryBtn}
            >
              Buscar Projetos
            </button>

            <button
              onClick={() =>
                navigate('/propostas')
              }
              style={styles.secondaryBtn}
            >
              Minhas Candidaturas
            </button>

            <button
              onClick={() =>
                navigate('/chat')
              }
              style={styles.chatBtn}
            >
              Chat
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() =>
                navigate(
                  '/criar-projeto'
                )
              }
              style={styles.primaryBtn}
            >
              Publicar Vaga
            </button>

            <button
              onClick={() =>
                navigate(
                  '/meus-anuncios'
                )
              }
              style={styles.secondaryBtn}
            >
              Meus Anúncios
            </button>

            <button
              onClick={() =>
                navigate('/chat')
              }
              style={styles.chatBtn}
            >
              Chat
            </button>
          </>
        )}
      </div>

      {role === 'freelancer' && (
        <div style={styles.mpSection}>
          <div style={styles.mpInfo}>
            <div>
              <h2 style={styles.mpTitle}>
                Recebimento via Pix
              </h2>

              <p style={styles.mpDescription}>
                Cadastre a chave Pix que receberá
                os repasses dos seus marcos.
              </p>
            </div>

            <span
              style={{
                ...styles.mpBadge,
                color: pixRegistered
                  ? '#00c851'
                  : '#ff6b00',
                backgroundColor:
                  pixRegistered
                    ? '#00c85115'
                    : '#ff6b0015',
                borderColor:
                  pixRegistered
                    ? '#00c85140'
                    : '#ff6b0040'
              }}
            >
              {pixRegistered
                ? 'Chave cadastrada'
                : 'Não cadastrada'}
            </span>
          </div>

          {pixRegistered && !pixEditing ? (
            <div style={styles.pixSaved}>
              <p
                style={{
                  ...styles.mpSuccess,
                  margin: 0
                }}
              >
                {PIX_TYPE_LABELS[pixKeyType] ||
                  'Chave'}
                : <strong>{pixKeyMasked}</strong>
              </p>

              <button
                type="button"
                onClick={() =>
                  setPixEditing(true)
                }
                style={styles.pixEditBtn}
              >
                Alterar chave
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSavePixKey}
              style={styles.pixForm}
            >
              <select
                value={pixKeyType}
                onChange={event =>
                  setPixKeyType(
                    event.target.value
                  )
                }
                style={styles.pixSelect}
              >
                {Object.entries(
                  PIX_TYPE_LABELS
                ).map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={pixKeyInput}
                onChange={event =>
                  setPixKeyInput(
                    event.target.value
                  )
                }
                placeholder={
                  PIX_PLACEHOLDERS[pixKeyType]
                }
                autoComplete="off"
                style={styles.pixInput}
              />

              <button
                type="submit"
                disabled={pixSaving}
                style={{
                  ...styles.pixSaveBtn,
                  opacity: pixSaving ? 0.6 : 1
                }}
              >
                {pixSaving
                  ? 'Salvando...'
                  : 'Salvar chave Pix'}
              </button>

              {pixRegistered && (
                <button
                  type="button"
                  onClick={() => {
                    setPixEditing(false);
                    setPixKeyInput('');
                  }}
                  style={styles.pixEditBtn}
                >
                  Cancelar
                </button>
              )}
            </form>
          )}
        </div>
      )}

      <div style={styles.kanbanSection}>
        <h2 style={styles.sectionTitle}>
          Projetos em Andamento
        </h2>

        {activeProjects.length === 0 ? (
          <div style={styles.emptyState}>
            <h3 style={styles.emptyTitle}>
              Nenhum projeto em andamento
            </h3>

            <p style={styles.emptyText}>
              {role === 'freelancer'
                ? 'Quando uma proposta sua for aceita, o projeto aparecerá aqui.'
                : 'Quando uma proposta for aceita, o projeto aparecerá aqui.'}
            </p>
          </div>
        ) : (
          <>
            {activeProjects.length > 1 && (
              <div style={styles.projectTabs}>
                {activeProjects.map(
                  project => (
                    <button
                      key={project.id}
                      onClick={() =>
                        handleSelectProject(
                          project
                        )
                      }
                      style={{
                        ...styles.tabBtn,
                        borderColor:
                          selectedProject?.id ===
                          project.id
                            ? '#ff6b00'
                            : '#333',
                        color:
                          selectedProject?.id ===
                          project.id
                            ? '#ff6b00'
                            : '#aaa'
                      }}
                    >
                      {project.title}
                    </button>
                  )
                )}
              </div>
            )}

            {selectedProject && (
              <>
                <div
                  style={
                    styles.projectHeader
                  }
                >
                  <div>
                    <h3
                      style={
                        styles.projectTitle
                      }
                    >
                      {selectedProject.title}
                    </h3>

                    <p
                      style={
                        styles.projectDescription
                      }
                    >
                      {role === 'client'
                        ? 'Acompanhe o andamento das etapas do projeto.'
                        : 'Acompanhe e atualize o andamento das suas etapas.'}
                    </p>
                  </div>

                  <span
                    style={{
                      ...styles.projectStatus,
                      backgroundColor:
                        selectedProjectPaid
                          ? '#00c85115'
                          : '#ff6b0015',
                      color:
                        selectedProjectPaid
                          ? '#00c851'
                          : '#ff6b00',
                      borderColor:
                        selectedProjectPaid
                          ? '#00c85140'
                          : '#ff6b0040'
                    }}
                  >
                    {selectedProjectPaid
                      ? 'Todos os pagamentos confirmados'
                      : 'Projeto em andamento'}
                  </span>
                </div>

                {selectedProjectPaid ? (
                  <div>
                    <div
                      style={
                        styles.milestoneSuccess
                      }
                    >
                      <div>
                        <strong
                          style={
                            styles.milestoneSuccessTitle
                          }
                        >
                          Projeto concluído
                        </strong>

                        <p
                          style={
                            styles.milestoneSuccessText
                          }
                        >
                          Todos os marcos foram
                          aprovados e pagos.
                        </p>
                      </div>

                      <span
                        style={
                          styles.paidBadge
                        }
                      >
                        Pago
                      </span>
                    </div>

                    <KanbanBoard
                      key={`${selectedProject.id}-${refreshKey}`}
                      projectId={
                        selectedProject.id
                      }
                      isFreelancer={
                        role ===
                        'freelancer'
                      }
                    />
                  </div>
                ) : selectedCurrentMilestone ? (
                  <div
                    style={
                      styles.milestoneCard
                    }
                  >
                    <div
                      style={
                        styles.milestoneHeader
                      }
                    >
                      <div>
                        <span
                          style={
                            styles.milestoneLabel
                          }
                        >
                          Próximo marco
                        </span>

                        <h3
                          style={
                            styles.milestoneTitle
                          }
                        >
                          {
                            selectedCurrentMilestone.title
                          }
                        </h3>
                      </div>

                      <span
                        style={
                          styles.milestoneAmount
                        }
                      >
                        R${' '}
                        {Number(
                          selectedCurrentMilestone.amount ||
                            0
                        ).toLocaleString(
                          'pt-BR',
                          {
                            minimumFractionDigits: 2
                          }
                        )}
                      </span>
                    </div>

                    {selectedCurrentPayment?.status ===
                    'paid' ? (
                      <div
                        style={
                          styles.paymentSuccess
                        }
                      >
                        <div
                          style={
                            styles.paymentIcon
                          }
                        >
                          ✓
                        </div>

                        <h3
                          style={
                            styles.paymentTitle
                          }
                        >
                          Pagamento confirmado
                        </h3>

                        <p
                          style={
                            styles.paymentText
                          }
                        >
                          Este marco já foi
                          pago com sucesso.
                        </p>
                      </div>
                    ) : selectedCurrentPayment?.status ===
                      'pending' ? (
                      <div
                        style={
                          styles.paymentWaiting
                        }
                      >
                        <div
                          style={
                            styles.paymentIcon
                          }
                        >
                          $
                        </div>

                        <h3
                          style={
                            styles.paymentTitle
                          }
                        >
                          Pagamento em processamento
                        </h3>

                        <p
                          style={
                            styles.paymentText
                          }
                        >
                          O pagamento deste
                          marco já foi iniciado.
                          Aguarde a confirmação
                          do pagamento Pix.
                        </p>

                        {role === 'client' && (
                          <button
                            type="button"
                            onClick={() =>
                              handlePayMilestone(
                                selectedProject.id,
                                selectedCurrentMilestone.id
                              )
                            }
                            style={
                              styles.payMilestoneButton
                            }
                          >
                            Ver QR Code Pix
                          </button>
                        )}
                      </div>
                    ) : canPaySelectedMilestone ? (
                      <div>
                        <p
                          style={
                            styles.paymentText
                          }
                        >
                          Este marco foi aprovado
                          e está liberado para
                          pagamento.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            handlePayMilestone(
                              selectedProject.id,
                              selectedCurrentMilestone.id
                            )
                          }
                          style={
                            styles.payMilestoneButton
                          }
                        >
                          Pagar marco com Pix
                        </button>
                      </div>
                    ) : role === 'freelancer' ? (
                      <div
                        style={
                          styles.paymentWaiting
                        }
                      >
                        <div
                          style={
                            styles.paymentIcon
                          }
                        >
                          $
                        </div>

                        <h3
                          style={
                            styles.paymentTitle
                          }
                        >
                          Aguardando pagamento
                        </h3>

                        <p
                          style={
                            styles.paymentText
                          }
                        >
                          O cliente precisa
                          concluir o pagamento
                          deste marco.
                        </p>
                      </div>
                    ) : (
                      <div
                        style={
                          styles.paymentWaiting
                        }
                      >
                        <div
                          style={
                            styles.paymentIcon
                          }
                        >
                          ⏳
                        </div>

                        <h3
                          style={
                            styles.paymentTitle
                          }
                        >
                          Aguardando aprovação
                        </h3>

                        <p
                          style={
                            styles.paymentText
                          }
                        >
                          Este marco precisa
                          ser aprovado antes
                          de liberar o pagamento.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={
                      styles.paymentWaiting
                    }
                  >
                    <div
                      style={
                        styles.paymentIcon
                      }
                    >
                      ✓
                    </div>

                    <h3
                      style={
                        styles.paymentTitle
                      }
                    >
                      Nenhum pagamento pendente
                    </h3>

                    <p
                      style={
                        styles.paymentText
                      }
                    >
                      Não existe um marco
                      aguardando pagamento
                      neste momento.
                    </p>
                  </div>
                )}

                <KanbanBoard
                  key={`${selectedProject.id}-${refreshKey}`}
                  projectId={
                    selectedProject.id
                  }
                  isFreelancer={
                    role === 'freelancer'
                  }
                  onMilestoneUpdated={() =>
                    refreshLists()
                  }
                />
              </>
            )}
          </>
        )}
      </div>

      <div style={styles.historySection}>
        <div
          style={styles.historyHeader}
        >
          <div>
            <h2
              style={
                styles.sectionTitle
              }
            >
              Histórico de Projetos
            </h2>

            <p
              style={
                styles.historySubtitle
              }
            >
              Projetos concluídos dos quais
              você participou.
            </p>
          </div>

          <span
            style={
              styles.historyCount
            }
          >
            {historyProjects.length}{' '}
            concluído(s)
          </span>
        </div>

        {historyProjects.length === 0 ? (
          <div
            style={
              styles.emptyState
            }
          >
            <h3
              style={
                styles.emptyTitle
              }
            >
              Nenhum projeto finalizado
            </h3>

            <p
              style={
                styles.emptyText
              }
            >
              Quando um projeto for
              concluído, ele aparecerá
              nesta seção.
            </p>
          </div>
        ) : (
          <div
            style={
              styles.historyList
            }
          >
            {historyProjects.map(
              project => {
                const pendingReview =
                  pendingReviews.find(
                    review =>
                      Number(
                        review.projectId
                      ) ===
                      Number(project.id)
                  );

                return (
                  <div
                    key={project.id}
                    style={
                      styles.historyCard
                    }
                  >
                    <div
                      style={
                        styles.historyCardTop
                      }
                    >
                      <div>
                        <h3
                          style={
                            styles.historyProjectTitle
                          }
                        >
                          {project.title}
                        </h3>

                        <p
                          style={
                            styles.historyParticipant
                          }
                        >
                          Projeto concluído
                        </p>
                      </div>

                      <span
                        style={
                          styles.completedBadge
                        }
                      >
                        Concluído
                      </span>
                    </div>

                    {pendingReview ? (
                      <button
                        onClick={() =>
                          handleOpenReview(
                            pendingReview
                          )
                        }
                        style={
                          styles.reviewButton
                        }
                      >
                        Avaliar participante
                      </button>
                    ) : (
                      <span
                        style={
                          styles.reviewDone
                        }
                      >
                        Avaliação não pendente
                      </span>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {selectedReview && (
        <div
          style={
            styles.modalOverlay
          }
        >
          <form
            onSubmit={
              handleSubmitReview
            }
            style={
              styles.reviewModal
            }
          >
            <button
              type="button"
              onClick={() =>
                setSelectedReview(null)
              }
              style={
                styles.modalClose
              }
            >
              ×
            </button>

            <h2
              style={
                styles.modalTitle
              }
            >
              Avaliar projeto
            </h2>

            <p
              style={
                styles.modalSubtitle
              }
            >
              Projeto:{' '}
              <strong>
                {
                  selectedReview.projectTitle
                }
              </strong>
            </p>

            <label
              style={
                styles.formLabel
              }
            >
              Sua nota
            </label>

            <div
              style={
                styles.ratingSelector
              }
            >
              {[1, 2, 3, 4, 5].map(
                value => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setRating(value)
                    }
                    style={{
                      ...styles.ratingStar,
                      color:
                        value <= rating
                          ? '#ffb400'
                          : '#555'
                    }}
                  >
                    ★
                  </button>
                )
              )}
            </div>

            <label
              htmlFor="reviewMessage"
              style={
                styles.formLabel
              }
            >
              Comentário
            </label>

            <textarea
              id="reviewMessage"
              value={reviewMessage}
              onChange={event =>
                setReviewMessage(
                  event.target.value
                )
              }
              maxLength={1000}
              placeholder="Conte como foi sua experiência..."
              style={
                styles.reviewTextarea
              }
            />

            <button
              type="submit"
              disabled={
                reviewLoading
              }
              style={
                styles.submitReviewButton
              }
            >
              {reviewLoading
                ? 'Enviando...'
                : 'Enviar avaliação'}
            </button>
          </form>
        </div>
      )}
      {pixTarget && (
        <PixPaymentModal
          projectId={pixTarget.projectId}
          milestoneId={pixTarget.milestoneId}
          onClose={handlePixClosed}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 20px',
    color: '#fff'
  },

  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
    color: '#aaa'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #222',
    paddingBottom: '24px',
    marginBottom: '30px',
    gap: '20px'
  },

  title: {
    fontSize: '28px',
    margin: 0
  },

  subtitle: {
    color: '#777',
    margin: '7px 0 0'
  },

  userName: {
    color: '#ff6b00',
    fontWeight: '600'
  },

  badge: {
    backgroundColor: '#151515',
    border: '1px solid #292929',
    padding: '9px 16px',
    borderRadius: '20px',
    color: '#888'
  },

  actions: {
    display: 'flex',
    gap: '10px',
    marginBottom: '36px',
    flexWrap: 'wrap'
  },

  primaryBtn: {
    backgroundColor: '#ff6b00',
    color: '#fff',
    border: 'none',
    padding: '11px 18px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  secondaryBtn: {
    backgroundColor: '#171717',
    color: '#ddd',
    border: '1px solid #303030',
    padding: '11px 18px',
    borderRadius: '6px',
    cursor: 'pointer'
  },

  chatBtn: {
    backgroundColor: '#151515',
    color: '#00c851',
    border: '1px solid #00c85140',
    padding: '11px 18px',
    borderRadius: '6px',
    cursor: 'pointer'
  },

  mpSection: {
    backgroundColor: '#111',
    border: '1px solid #242424',
    borderRadius: '10px',
    padding: '22px 25px',
    marginBottom: '30px'
  },

  mpInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap'
  },

  mpTitle: {
    margin: 0,
    fontSize: '18px',
    borderLeft: '3px solid #ff6b00',
    paddingLeft: '10px'
  },

  mpDescription: {
    margin: '8px 0 0 13px',
    color: '#777',
    fontSize: '13px'
  },

  mpBadge: {
    border: '1px solid',
    borderRadius: '20px',
    padding: '6px 11px',
    fontSize: '12px'
  },

  mpSuccess: {
    margin: '16px 0 0 13px',
    color: '#00c851',
    fontSize: '13px'
  },

  pixSaved: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '15px',
    flexWrap: 'wrap',
    margin: '16px 0 0 13px'
  },

  pixEditBtn: {
    backgroundColor: 'transparent',
    color: '#ccc',
    border: '1px solid #333',
    borderRadius: '6px',
    padding: '9px 14px',
    fontSize: '12px',
    cursor: 'pointer'
  },

  pixForm: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: '18px'
  },

  pixSelect: {
    backgroundColor: '#101010',
    border: '1px solid #333',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#fff',
    fontSize: '13px'
  },

  pixInput: {
    flex: '1 1 240px',
    minWidth: '200px',
    backgroundColor: '#101010',
    border: '1px solid #333',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#fff',
    fontSize: '13px'
  },

  pixSaveBtn: {
    backgroundColor: '#ff6b00',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '11px 18px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  kanbanSection: {
    backgroundColor: '#111',
    border: '1px solid #242424',
    borderRadius: '10px',
    padding: '25px',
    marginBottom: '30px'
  },

  sectionTitle: {
    fontSize: '18px',
    margin: '0 0 12px',
    borderLeft: '3px solid #ff6b00',
    paddingLeft: '10px'
  },

  projectTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '22px',
    flexWrap: 'wrap'
  },

  tabBtn: {
    backgroundColor: 'transparent',
    border: '1px solid',
    padding: '7px 14px',
    borderRadius: '20px',
    cursor: 'pointer'
  },

  projectHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    paddingBottom: '20px',
    marginBottom: '20px',
    borderBottom: '1px solid #222',
    flexWrap: 'wrap'
  },

  projectTitle: {
    margin: 0,
    fontSize: '17px'
  },

  projectDescription: {
    margin: '6px 0 0',
    color: '#666'
  },

  projectStatus: {
    border: '1px solid',
    padding: '6px 11px',
    borderRadius: '20px',
    fontSize: '11px'
  },

  milestoneCard: {
    backgroundColor: '#151515',
    border: '1px solid #292929',
    borderRadius: '8px',
    padding: '22px',
    marginBottom: '20px'
  },

  milestoneHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap',
    marginBottom: '20px'
  },

  milestoneLabel: {
    display: 'block',
    color: '#ff6b00',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: '5px'
  },

  milestoneTitle: {
    margin: 0,
    color: '#fff',
    fontSize: '18px'
  },

  milestoneAmount: {
    color: '#00c851',
    fontSize: '17px',
    fontWeight: '700'
  },

  payMilestoneButton: {
    marginTop: '18px',
    backgroundColor: '#ff6b00',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 20px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  milestoneSuccess: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: '#0d1a12',
    border: '1px solid #00c85140',
    borderRadius: '8px',
    padding: '18px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },

  milestoneSuccessTitle: {
    display: 'block',
    color: '#00c851'
  },

  milestoneSuccessText: {
    margin: '5px 0 0',
    color: '#777'
  },

  paidBadge: {
    color: '#00c851',
    backgroundColor: '#00c85115',
    border: '1px solid #00c85140',
    borderRadius: '20px',
    padding: '6px 11px'
  },

  paymentWaiting: {
    backgroundColor: '#15120f',
    border: '1px solid #3a2b1c',
    borderRadius: '8px',
    padding: '40px 25px',
    textAlign: 'center'
  },

  paymentSuccess: {
    backgroundColor: '#0d1a12',
    border: '1px solid #00c85140',
    borderRadius: '8px',
    padding: '30px 25px',
    textAlign: 'center'
  },

  paymentIcon: {
    width: '44px',
    height: '44px',
    margin: '0 auto 16px',
    borderRadius: '50%',
    backgroundColor: '#ff6b0015',
    border: '1px solid #ff6b0040',
    color: '#ff6b00',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '700'
  },

  paymentTitle: {
    margin: '0 0 8px',
    fontSize: '17px',
    color: '#fff'
  },

  paymentText: {
    margin: '0 auto',
    maxWidth: '500px',
    color: '#aaa',
    fontSize: '14px',
    lineHeight: '1.6'
  },

  emptyState: {
    padding: '35px 25px',
    textAlign: 'center',
    border: '1px dashed #292929',
    borderRadius: '8px'
  },

  emptyTitle: {
    margin: '0 0 8px',
    fontSize: '16px',
    color: '#ddd'
  },

  emptyText: {
    margin: 0,
    color: '#666',
    fontSize: '13px'
  },

  historySection: {
    backgroundColor: '#111',
    border: '1px solid #242424',
    borderRadius: '10px',
    padding: '25px'
  },

  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '22px',
    flexWrap: 'wrap'
  },

  historySubtitle: {
    margin: '6px 0 0 13px',
    color: '#777',
    fontSize: '13px'
  },

  historyCount: {
    color: '#00c851',
    backgroundColor: '#00c85115',
    border: '1px solid #00c85140',
    borderRadius: '20px',
    padding: '6px 11px'
  },

  historyList: {
    display: 'grid',
    gap: '14px'
  },

  historyCard: {
    backgroundColor: '#171717',
    border: '1px solid #292929',
    borderRadius: '8px',
    padding: '18px'
  },

  historyCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '15px',
    flexWrap: 'wrap'
  },

  historyProjectTitle: {
    margin: 0,
    fontSize: '16px',
    color: '#fff'
  },

  historyParticipant: {
    margin: '7px 0 0',
    color: '#888'
  },

  completedBadge: {
    color: '#00c851',
    backgroundColor: '#00c85115',
    border: '1px solid #00c85140',
    borderRadius: '20px',
    padding: '5px 10px'
  },

  reviewButton: {
    marginTop: '16px',
    backgroundColor: '#ff6b00',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 15px',
    cursor: 'pointer'
  },

  reviewDone: {
    display: 'inline-block',
    marginTop: '15px',
    color: '#00c851',
    fontSize: '12px'
  },

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    backgroundColor: '#000000cc',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },

  reviewModal: {
    position: 'relative',
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#171717',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '28px'
  },

  modalClose: {
    position: 'absolute',
    top: '12px',
    right: '15px',
    border: 'none',
    background: 'transparent',
    color: '#888',
    fontSize: '28px',
    cursor: 'pointer'
  },

  modalTitle: {
    margin: '0 0 15px',
    color: '#fff',
    fontSize: '21px'
  },

  modalSubtitle: {
    margin: '7px 0',
    color: '#999',
    fontSize: '13px'
  },

  formLabel: {
    display: 'block',
    margin: '20px 0 8px',
    color: '#ddd',
    fontSize: '13px',
    fontWeight: '600'
  },

  ratingSelector: {
    display: 'flex',
    gap: '8px'
  },

  ratingStar: {
    border: 'none',
    background: 'transparent',
    fontSize: '34px',
    cursor: 'pointer',
    padding: '0 2px'
  },

  reviewTextarea: {
    width: '100%',
    minHeight: '110px',
    boxSizing: 'border-box',
    resize: 'vertical',
    backgroundColor: '#101010',
    border: '1px solid #333',
    borderRadius: '6px',
    padding: '12px',
    color: '#fff',
    fontSize: '13px'
  },

  submitReviewButton: {
    width: '100%',
    marginTop: '20px',
    padding: '12px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#ff6b00',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer'
  }
};