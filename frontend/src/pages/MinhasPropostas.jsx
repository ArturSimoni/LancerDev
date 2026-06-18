import { useEffect, useState } from 'react';
import api from '../services/api';

export default function MinhasPropostas() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyProposals() {
      try {
        const response = await api.get('/proposals/minhas-propostas');
        setProposals(response.data);
      } catch (error) {
        console.error('Erro ao buscar suas propostas:', error);
      } finally {
        // 🔒 corrigido de 'fontally' para 'finally' para resolver o erro do compilador
        setLoading(false);
      }
    }
    fetchMyProposals();
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>Minhas Propostas Enviadas</h2>
      <p style={{ color: '#aaa', marginBottom: '30px' }}>Acompanhe o andamento e o status das suas candidaturas.</p>

      {loading ? (
        <p>Carregando propostas...</p>
      ) : proposals.length === 0 ? (
        <p style={{ color: '#aaa' }}>Você ainda não enviou nenhuma proposta.</p>
      ) : (
        <div style={styles.grid}>
          {proposals.map((proposal) => (
            <div key={proposal.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.projectTitle}>{proposal.project?.title || 'Projeto sem Título'}</h3>
                <span style={{
                  ...styles.statusBadge,
                  color: proposal.status === 'accepted' ? '#00c851' : proposal.status === 'rejected' ? '#ff3333' : '#ff6b00',
                  borderColor: proposal.status === 'accepted' ? '#00c851' : proposal.status === 'rejected' ? '#ff3333' : '#ff6b00'
                }}>
                  {proposal.status}
                </span>
              </div>
              <p style={styles.coverText}>"{proposal.coverText || 'Sem mensagem adicional.'}"</p>
              <div style={styles.cardFooter}>
                <span>Sua oferta: <strong>R$ {Number(proposal.amount || 0).toLocaleString('pt-BR')}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '1200px', margin: '40px auto', padding: '0 20px', color: '#fff' },
  sectionTitle: { fontSize: '26px', marginBottom: '5px', borderLeft: '4px solid #ff6b00', paddingLeft: '10px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' },
  card: { backgroundColor: '#1e1e1e', border: '1px solid #222', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '15px' },
  projectTitle: { fontSize: '18px', margin: 0 },
  statusBadge: { backgroundColor: '#222', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', textTransform: 'uppercase', border: '1px solid', fontWeight: 'bold' },
  coverText: { color: '#aaa', fontSize: '14px', fontStyle: 'italic', lineHeight: '1.4', marginBottom: '15px' },
  cardFooter: { borderTop: '1px solid #222', paddingTop: '12px', fontSize: '14px', color: '#fff' }
};