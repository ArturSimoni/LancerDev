import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import KanbanBoard from '../components/KanbanBoard';

export default function Dashboard() {
  const navigate = useNavigate();

  const role = localStorage.getItem('@LancerDev:role');

  const user = localStorage.getItem('@LancerDev:user')
    ? JSON.parse(localStorage.getItem('@LancerDev:user'))
    : null;

  const [activeProjects, setActiveProjects] = useState([]);
  const [historyProjects, setHistoryProjects] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState({});
  const [selectedReview, setSelectedReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

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
      const [activeResponse, historyResponse, pendingResponse] = await Promise.all([
        api.get('/projects/ativos'),
        api.get('/projects/historico'),
        api.get('/reviews/pendentes')
      ]);

      const active = Array.isArray(activeResponse.data)
        ? activeResponse.data
        : [];

      setActiveProjects(active);
      setHistoryProjects(
        Array.isArray(historyResponse.data) ? historyResponse.data : []
      );
      setPendingReviews(
        Array.isArray(pendingResponse.data) ? pendingResponse.data : []
      );

      setSelectedProject(current => {
        if (current && active.some(project => project.id === current.id)) {
          return active.find(project => project.id === current.id);
        }

        return active[0] || null;
      });

      await checkProjectPayments(active);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkProjectPayments(projects) {
    const status = {};

    await Promise.all(
      projects.map(async project => {
        try {
          await api.get(`/milestones/projeto/${project.id}`);
          status[project.id] = true;
        } catch (error) {
          status[project.id] = false;
        }
      })
    );

    setPaymentStatus(status);
  }

  function handleSelectProject(project) {
    setSelectedProject(project);
  }

  function handleOpenReview(project) {
    setSelectedReview(project);
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
        projectId: selectedReview.projectId,
        rating: Number(rating),
        message: reviewMessage.trim()
      });

      alert('Avaliação enviada com sucesso!');
      setSelectedReview(null);
      setRating(5);
      setReviewMessage('');

      const [historyResponse, pendingResponse] = await Promise.all([
        api.get('/projects/historico'),
        api.get('/reviews/pendentes')
      ]);

      setHistoryProjects(
        Array.isArray(historyResponse.data) ? historyResponse.data : []
      );

      setPendingReviews(
        Array.isArray(pendingResponse.data) ? pendingResponse.data : []
      );
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      alert(
        error.response?.data?.message ||
        'Não foi possível enviar a avaliação.'
      );
    } finally {
      setReviewLoading(false);
    }
  }

  if (loading) {
    return <div style={styles.loading}>Carregando painel...</div>;
  }

  const selectedProjectPaid =
    selectedProject && paymentStatus[selectedProject.id] === true;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Painel de Controle</h1>
          <p style={styles.subtitle}>
            Bem-vindo, <span style={styles.userName}>{user?.name}</span>
          </p>
        </div>

        <div style={styles.badge}>
          Perfil:{' '}
          <strong
            style={{
              color: role === 'freelancer' ? '#00c851' : '#33b5e5'
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
              onClick={() => navigate('/projetos')}
              style={styles.primaryBtn}
            >
              Buscar Projetos
            </button>

            <button
              onClick={() => navigate('/propostas')}
              style={styles.secondaryBtn}
            >
              Minhas Candidaturas
            </button>

            <button
              onClick={() => navigate('/chat')}
              style={styles.chatBtn}
            >
              Chat
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/criar-projeto')}
              style={styles.primaryBtn}
            >
              Publicar Vaga
            </button>

            <button
              onClick={() => navigate('/meus-anuncios')}
              style={styles.secondaryBtn}
            >
              Meus Anúncios
            </button>

            <button
              onClick={() => navigate('/chat')}
              style={styles.chatBtn}
            >
              Chat
            </button>
          </>
        )}
      </div>

      <div style={styles.kanbanSection}>
        <h2 style={styles.sectionTitle}>Projetos em Andamento</h2>

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
                {activeProjects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => handleSelectProject(project)}
                    style={{
                      ...styles.tabBtn,
                      borderColor:
                        selectedProject?.id === project.id
                          ? '#ff6b00'
                          : '#333',
                      color:
                        selectedProject?.id === project.id
                          ? '#ff6b00'
                          : '#aaa'
                    }}
                  >
                    {project.title}
                  </button>
                ))}
              </div>
            )}

            {selectedProject && (
              <>
                <div style={styles.projectHeader}>
                  <div>
                    <h3 style={styles.projectTitle}>
                      {selectedProject.title}
                    </h3>

                    <p style={styles.projectDescription}>
                      {role === 'client'
                        ? 'Acompanhe o andamento das etapas do projeto.'
                        : 'Acompanhe e atualize o andamento das suas etapas.'}
                    </p>
                  </div>

                  <span
                    style={{
                      ...styles.projectStatus,
                      backgroundColor: selectedProjectPaid
                        ? '#00c85115'
                        : '#ff6b0015',
                      color: selectedProjectPaid
                        ? '#00c851'
                        : '#ff6b00',
                      borderColor: selectedProjectPaid
                        ? '#00c85140'
                        : '#ff6b0040'
                    }}
                  >
                    {selectedProjectPaid
                      ? 'Pagamento confirmado'
                      : 'Pagamento pendente'}
                  </span>
                </div>

                {selectedProjectPaid ? (
                  <KanbanBoard
                    projectId={selectedProject.id}
                    isFreelancer={role === 'freelancer'}
                  />
                ) : (
                  <div style={styles.paymentWaiting}>
                    <div style={styles.paymentIcon}>$</div>

                    <h3 style={styles.paymentTitle}>
                      Aguardando pagamento
                    </h3>

                    <p style={styles.paymentText}>
                      O Kanban será liberado assim que o pagamento deste
                      projeto for confirmado.
                    </p>

                    {role === 'freelancer' && (
                      <p style={styles.paymentSecondaryText}>
                        O cliente precisa concluir o pagamento para que
                        você possa iniciar as atividades do projeto.
                      </p>
                    )}

                    {role === 'client' && (
                      <p style={styles.paymentSecondaryText}>
                        Após a confirmação do pagamento, o Kanban será
                        liberado automaticamente.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div style={styles.historySection}>
        <div style={styles.historyHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Histórico de Projetos</h2>
            <p style={styles.historySubtitle}>
              Projetos concluídos dos quais você participou.
            </p>
          </div>

          <span style={styles.historyCount}>
            {historyProjects.length} concluído(s)
          </span>
        </div>

        {historyProjects.length === 0 ? (
          <div style={styles.emptyState}>
            <h3 style={styles.emptyTitle}>
              Nenhum projeto finalizado
            </h3>
            <p style={styles.emptyText}>
              Quando um projeto for concluído, ele aparecerá nesta seção.
            </p>
          </div>
        ) : (
          <div style={styles.historyList}>
            {historyProjects.map(project => {
              const acceptedProposal = project.proposals?.find(
                proposal => proposal.status === 'accepted'
              );

              const otherParticipant =
                Number(project.clientId) === Number(user?.id)
                  ? acceptedProposal?.freelancer?.name
                  : project.client?.name;

              const pendingReview = pendingReviews.find(
                review => Number(review.projectId) === Number(project.id)
              );

              return (
                <div key={project.id} style={styles.historyCard}>
                  <div style={styles.historyCardTop}>
                    <div style={styles.historyProjectInfo}>
                      <h3 style={styles.historyProjectTitle}>
                        {project.title}
                      </h3>

                      <p style={styles.historyParticipant}>
                        {role === 'client'
                          ? 'Freelancer: '
                          : 'Cliente: '}
                        <strong>{otherParticipant || 'Participante'}</strong>
                      </p>
                    </div>

                    <span style={styles.completedBadge}>
                      Concluído
                    </span>
                  </div>

                  <div style={styles.historyDetails}>
                    <span>
                      Orçamento: R$ {Number(project.budget || 0).toLocaleString('pt-BR')}
                    </span>

                    <span>
                      {project.milestones?.length || 0} etapa(s)
                    </span>

                    <span>
                      {project.reviews?.length || 0} avaliação(ões)
                    </span>
                  </div>

                  {project.reviews?.length > 0 && (
                    <div style={styles.projectReviews}>
                      <strong style={styles.projectReviewsTitle}>
                        Avaliações deste projeto
                      </strong>

                      {project.reviews.map(review => (
                        <div key={review.id} style={styles.reviewItem}>
                          <div style={styles.reviewItemHeader}>
                            <span style={styles.reviewAuthor}>
                              {review.reviewer?.name || 'Usuário'}
                            </span>

                            <span style={styles.reviewStars}>
                              {'★'.repeat(review.rating)}
                              {'☆'.repeat(5 - review.rating)}
                            </span>
                          </div>

                          {review.message && (
                            <p style={styles.reviewMessage}>
                              {review.message}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingReview && (
                    <button
                      onClick={() => handleOpenReview(pendingReview)}
                      style={styles.reviewButton}
                    >
                      Avaliar {pendingReview.reviewee?.name || 'participante'}
                    </button>
                  )}

                  {!pendingReview && (
                    <span style={styles.reviewDone}>
                      {project.reviews?.some(
                        review => Number(review.reviewerId) === Number(user?.id)
                      )
                        ? 'Você já avaliou este projeto'
                        : 'Avaliação não pendente'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedReview && (
        <div style={styles.modalOverlay}>
          <form onSubmit={handleSubmitReview} style={styles.reviewModal}>
            <button
              type="button"
              onClick={() => setSelectedReview(null)}
              style={styles.modalClose}
            >
              ×
            </button>

            <h2 style={styles.modalTitle}>Avaliar projeto</h2>

            <p style={styles.modalSubtitle}>
              Projeto: <strong>{selectedReview.projectTitle}</strong>
            </p>

            <p style={styles.modalSubtitle}>
              Avaliando: <strong>{selectedReview.reviewee?.name}</strong>
            </p>

            <label style={styles.formLabel}>
              Sua nota
            </label>

            <div style={styles.ratingSelector}>
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  style={{
                    ...styles.ratingStar,
                    color: value <= rating ? '#ffb400' : '#555'
                  }}
                  aria-label={`Nota ${value}`}
                >
                  ★
                </button>
              ))}
            </div>

            <label htmlFor="reviewMessage" style={styles.formLabel}>
              Comentário
            </label>

            <textarea
              id="reviewMessage"
              value={reviewMessage}
              onChange={event => setReviewMessage(event.target.value)}
              maxLength={1000}
              placeholder="Conte como foi sua experiência com este projeto..."
              style={styles.reviewTextarea}
            />

            <span style={styles.characterCount}>
              {reviewMessage.length}/1000 caracteres
            </span>

            <button
              type="submit"
              disabled={reviewLoading}
              style={{
                ...styles.submitReviewButton,
                opacity: reviewLoading ? 0.6 : 1
              }}
            >
              {reviewLoading ? 'Enviando...' : 'Enviar avaliação'}
            </button>
          </form>
        </div>
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
    color: '#aaa',
    fontSize: '16px'
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
    margin: 0,
    fontWeight: '700'
  },
  subtitle: {
    color: '#777',
    margin: '7px 0 0',
    fontSize: '14px'
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
    fontSize: '13px',
    color: '#888',
    whiteSpace: 'nowrap'
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
    cursor: 'pointer',
    fontSize: '13px'
  },
  secondaryBtn: {
    backgroundColor: '#171717',
    color: '#ddd',
    border: '1px solid #303030',
    padding: '11px 18px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px'
  },
  chatBtn: {
    backgroundColor: '#151515',
    color: '#00c851',
    border: '1px solid #00c85140',
    padding: '11px 18px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px'
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
    paddingLeft: '10px',
    fontWeight: '600'
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
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500'
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
    fontSize: '17px',
    fontWeight: '600'
  },
  projectDescription: {
    margin: '6px 0 0',
    color: '#666',
    fontSize: '13px'
  },
  projectStatus: {
    border: '1px solid',
    padding: '6px 11px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  paymentWaiting: {
    backgroundColor: '#15120f',
    border: '1px solid #3a2b1c',
    borderRadius: '8px',
    padding: '45px 25px',
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
  paymentSecondaryText: {
    margin: '10px auto 0',
    maxWidth: '500px',
    color: '#666',
    fontSize: '12px',
    lineHeight: '1.5'
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
    padding: '6px 11px',
    fontSize: '12px',
    whiteSpace: 'nowrap'
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
  historyProjectInfo: {
    minWidth: 0
  },
  historyProjectTitle: {
    margin: 0,
    fontSize: '16px',
    color: '#fff'
  },
  historyParticipant: {
    margin: '7px 0 0',
    color: '#888',
    fontSize: '13px'
  },
  completedBadge: {
    color: '#00c851',
    backgroundColor: '#00c85115',
    border: '1px solid #00c85140',
    borderRadius: '20px',
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: '600'
  },
  historyDetails: {
    display: 'flex',
    gap: '18px',
    flexWrap: 'wrap',
    marginTop: '16px',
    paddingTop: '13px',
    borderTop: '1px solid #292929',
    color: '#888',
    fontSize: '12px'
  },
  projectReviews: {
    marginTop: '16px',
    paddingTop: '14px',
    borderTop: '1px solid #292929'
  },
  projectReviewsTitle: {
    display: 'block',
    color: '#ddd',
    fontSize: '13px',
    marginBottom: '10px'
  },
  reviewItem: {
    padding: '10px 0',
    borderBottom: '1px solid #252525'
  },
  reviewItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px'
  },
  reviewAuthor: {
    color: '#aaa',
    fontSize: '12px',
    fontWeight: '600'
  },
  reviewStars: {
    color: '#ffb400',
    letterSpacing: '2px',
    fontSize: '13px'
  },
  reviewMessage: {
    margin: '7px 0 0',
    color: '#999',
    fontSize: '13px',
    lineHeight: '1.5'
  },
  reviewButton: {
    marginTop: '16px',
    backgroundColor: '#ff6b00',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 15px',
    fontSize: '12px',
    fontWeight: '600',
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
    padding: '28px',
    boxShadow: '0 20px 60px #00000080'
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
    fontSize: '13px',
    outline: 'none'
  },
  characterCount: {
    display: 'block',
    textAlign: 'right',
    color: '#666',
    fontSize: '11px',
    marginTop: '5px'
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