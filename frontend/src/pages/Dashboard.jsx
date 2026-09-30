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
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState({});

  useEffect(() => {
    if (!role) {
      navigate('/login');
      return;
    }

    loadActiveProjects();
  }, [role]);

  async function loadActiveProjects() {
    try {
      const response = await api.get('/projects/ativos');

      setActiveProjects(response.data);

      if (response.data.length > 0) {
        setSelectedProject(response.data[0]);
        await checkProjectPayments(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar projetos ativos:', error);
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
          if (error.response?.status === 403) {
            status[project.id] = false;
          } else {
            status[project.id] = false;
          }
        }
      })
    );

    setPaymentStatus(status);
  }

  function handleSelectProject(project) {
    setSelectedProject(project);
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
                    <div style={styles.paymentIcon}>
                      $
                    </div>

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
    padding: '25px'
  },

  sectionTitle: {
    fontSize: '18px',
    margin: '0 0 22px',
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
    padding: '45px 25px',
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
  }
};