import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import KanbanBoard from '../components/KanbanBoard'; // ← importar

export default function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('@LancerDev:role');
  const user = localStorage.getItem('@LancerDev:user')
    ? JSON.parse(localStorage.getItem('@LancerDev:user'))
    : null;

  const [activeProjects, setActiveProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role) { navigate('/login'); return; }
    loadActiveProjects();
  }, [role]);

  async function loadActiveProjects() {
    try {
      const response = await api.get('/projects/ativos');
      setActiveProjects(response.data);
      if (response.data.length > 0) setSelectedProject(response.data[0]);
    } catch (error) {
      console.error('Erro ao carregar projetos ativos:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={styles.loading}>Carregando painel...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Painel de Controle</h1>
          <p style={styles.subtitle}>
            Bem-vindo, <span style={{ color: '#ff6b00', fontWeight: 'bold' }}>{user?.name}</span>
          </p>
        </div>
        <div style={styles.badge}>
          Perfil: <strong style={{ color: role === 'freelancer' ? '#00c851' : '#33b5e5' }}>
            {role?.toUpperCase()}
          </strong>
        </div>
      </div>

      {/* Ações rápidas */}
      <div style={styles.actions}>
        {role === 'freelancer' ? (
          <>
            <button onClick={() => navigate('/projetos')} style={styles.primaryBtn}>🔎 Buscar Projetos</button>
            <button onClick={() => navigate('/propostas')} style={styles.secondaryBtn}>📄 Minhas Candidaturas</button>
            <button onClick={() => navigate('/chat')} style={styles.chatBtn}>💬 Chat</button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/criar-projeto')} style={styles.primaryBtn}>➕ Publicar Vaga</button>
            <button onClick={() => navigate('/meus-anuncios')} style={styles.secondaryBtn}>📋 Meus Anúncios</button>
            <button onClick={() => navigate('/chat')} style={styles.chatBtn}>💬 Chat</button>
          </>
        )}
      </div>

      {/* Kanban de projetos em andamento */}
      <div style={styles.kanbanSection}>
        <h2 style={styles.sectionTitle}>📌 Projetos em Andamento</h2>

        {activeProjects.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            {role === 'freelancer'
              ? 'Nenhuma proposta aceita ainda. Candidate-se a projetos!'
              : 'Nenhum projeto em andamento. Publique uma vaga e aceite uma proposta!'}
          </p>
        ) : (
          <>
            {/* Seletor de projeto se tiver mais de um */}
            {activeProjects.length > 1 && (
              <div style={styles.projectTabs}>
                {activeProjects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    style={{
                      ...styles.tabBtn,
                      borderColor: selectedProject?.id === p.id ? '#ff6b00' : '#333',
                      color: selectedProject?.id === p.id ? '#ff6b00' : '#aaa',
                    }}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            )}

            {selectedProject && (
              <>
                <p style={{ color: '#aaa', fontSize: '14px', margin: '0 0 10px 0' }}>
                  {selectedProject.title}
                  {role === 'client' && (
                    <span style={{ color: '#666', marginLeft: '10px', fontSize: '12px' }}>
                      (somente visualização)
                    </span>
                  )}
                </p>
                <KanbanBoard
                  projectId={selectedProject.id}
                  isFreelancer={role === 'freelancer'}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1200px', margin: '40px auto', padding: '0 20px', color: '#fff' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#fff', fontSize: '18px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '30px' },
  title: { fontSize: '28px', margin: 0 },
  subtitle: { color: '#aaa', margin: '5px 0 0 0' },
  badge: { backgroundColor: '#1e1e1e', border: '1px solid #333', padding: '8px 16px', borderRadius: '20px', fontSize: '14px' },
  actions: { display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' },
  primaryBtn: { backgroundColor: '#ff6b00', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  secondaryBtn: { backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #333', padding: '12px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  chatBtn: { backgroundColor: '#00c851', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  kanbanSection: { backgroundColor: '#1e1e1e', border: '1px solid #222', borderRadius: '8px', padding: '25px' },
  sectionTitle: { fontSize: '18px', margin: '0 0 20px 0', borderLeft: '4px solid #ff6b00', paddingLeft: '10px' },
  projectTabs: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  tabBtn: { backgroundColor: 'transparent', border: '1px solid', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
};