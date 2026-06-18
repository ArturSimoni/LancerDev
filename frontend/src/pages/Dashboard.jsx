import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('@LancerDev:role');
  const user = localStorage.getItem('@LancerDev:user') ? JSON.parse(localStorage.getItem('@LancerDev:user')) : null;

  const [metrics, setMetrics] = useState({ activeProjects: 0, totalAmount: 0, proposalsCount: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role) {
      navigate('/login');
      return;
    }

    async function fetchDashboardData() {
      try {
        // Exemplo de rota unificada de métricas do backend
        const response = await api.get('/dashboard/metrics');
        setMetrics(response.data.metrics);
        setRecentActivities(response.data.recent);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [role, navigate]);

  if (loading) {
    return <div style={styles.loading}>Carregando métricas do painel...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Cabeçalho de Boas-Vindas */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Painel de Controle</h1>
          <p style={styles.subtitle}>Bem-vindo de volta, <span style={{ color: '#ff6b00', fontWeight: 'bold' }}>{user?.name}</span>!</p>
        </div>
        <div style={styles.badge}>
          Perfil Atual: <strong style={{ color: role === 'freelancer' ? '#00c851' : '#33b5e5' }}>{role?.toUpperCase()}</strong>
        </div>
      </div>

      {/* Grid de Cards de Métricas Estilizados */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>
            {role === 'freelancer' ? 'Projetos em Andamento' : 'Vagas Publicadas'}
          </span>
          <h2 style={styles.metricValue}>{metrics.activeProjects}</h2>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>
            {role === 'freelancer' ? 'Ganhos Estimados' : 'Orçamento Total Alocado'}
          </span>
          <h2 style={{ ...styles.metricValue, color: '#00c851' }}>
            R$ {Number(metrics.totalAmount).toLocaleString('pt-BR')}
          </h2>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>
            {role === 'freelancer' ? 'Propostas Enviadas' : 'Propostas Recebidas'}
          </span>
          <h2 style={styles.metricValue}>{metrics.proposalsCount}</h2>
        </div>
      </div>

      {/* Conteúdo Dividido por Perfil / Ações Rápidas */}
      <div style={styles.contentGrid}>
        <div style={styles.mainPanel}>
          <h3 style={styles.sectionTitle}>Atividades Recentes</h3>
          {recentActivities.length === 0 ? (
            <p style={styles.emptyText}>Nenhuma atividade ou atualização registrada recentemente.</p>
          ) : (
            <div style={styles.activityList}>
              {recentActivities.map((activity) => (
                <div key={activity.id} style={styles.activityItem}>
                  <span style={styles.activityDot}></span>
                  <p style={styles.activityText}>{activity.description}</p>
                  <span style={styles.activityTime}>{new Date(activity.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Barra Lateral de Atalhos Rápidos e Suporte */}
        <div style={styles.sidebar}>
          <h3 style={styles.sectionTitle}>Ações Rápidas</h3>
          
          {role === 'freelancer' ? (
            <>
              <button onClick={() => navigate('/projetos')} style={styles.primaryBtn}>🔎 Buscar Novos Projetos</button>
              <button onClick={() => navigate('/propostas')} style={styles.secondaryBtn}>📄 Ver Minhas Candidaturas</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/criar-projeto')} style={styles.primaryBtn}>➕ Publicar Nova Vaga</button>
              <button onClick={() => navigate('/meus-anuncios')} style={styles.secondaryBtn}>📋 Gerenciar Meus Anúncios</button>
            </>
          )}

          {/* 💬 MÓDULO DO CHAT: Botão Flutuante de Atalho */}
          <div style={styles.chatBoxWidget}>
            <h4>Mensagens</h4>
            <p>Combine prazos e tire dúvidas diretamente com a outra parte.</p>
            <button onClick={() => navigate('/chat')} style={styles.chatBtn}>💬 Abrir Chat em Tempo Real</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1200px', margin: '40px auto', padding: '0 20px', color: '#fff', fontFamily: 'sans-serif' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#fff', fontSize: '18px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '30px' },
  title: { fontSize: '28px', margin: 0 },
  subtitle: { color: '#aaa', margin: '5px 0 0 0', fontSize: '16px' },
  badge: { backgroundColor: '#1e1e1e', border: '1px solid #333', padding: '8px 16px', borderRadius: '20px', fontSize: '14px' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' },
  metricCard: { backgroundColor: '#1e1e1e', border: '1px solid #222', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  metricLabel: { color: '#aaa', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  metricValue: { fontSize: '32px', margin: '10px 0 0 0', fontWeight: 'bold' },
  contentGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' },
  mainPanel: { backgroundColor: '#1e1e1e', border: '1px solid #222', borderRadius: '8px', padding: '25px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '15px' },
  sectionTitle: { fontSize: '18px', margin: '0 0 20px 0', borderLeft: '4px solid #ff6b00', paddingLeft: '10px' },
  emptyText: { color: '#666', fontStyle: 'italic' },
  primaryBtn: { backgroundColor: '#ff6b00', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' },
  secondaryBtn: { backgroundColor: '#252525', color: '#fff', border: '1px solid #333', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' },
  chatBoxWidget: { backgroundColor: '#111', border: '1px dashed #ff6b00', borderRadius: '8px', padding: '15px', marginTop: '15px' },
  chatBtn: { backgroundColor: '#00c851', color: '#fff', border: 'none', width: '100%', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  activityList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  activityItem: { display: 'flex', alignItems: 'center', gap: '15px', paddingBottom: '15px', borderBottom: '1px solid #252525' },
  activityDot: { width: '8px', height: '8px', backgroundColor: '#ff6b00', borderRadius: '50%' },
  activityText: { flex: 1, margin: 0, fontSize: '14px', color: '#ddd' },
  activityTime: { color: '#666', fontSize: '12px' }
};