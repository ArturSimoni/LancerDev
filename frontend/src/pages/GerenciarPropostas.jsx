import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function GerenciarPropostas() {
  const { projectId } = useParams(); 
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);

  async function loadProposals() {
    try {
      const response = await api.get(`/propostas/projeto/${projectId}`);
      setProposals(response.data);
    } catch (error) {
      console.error('Erro ao buscar candidaturas:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) loadProposals();
  }, [projectId]);

  async function handleAccept(proposalId, proposalMilestones) {
    if (!window.confirm("Deseja fechar contrato com este desenvolvedor?")) return;

    setAccepting(proposalId);
    try {
      // CORREÇÃO: prefixo /propostas coerente com o backend
      await api.post(`/propostas/${proposalId}/accept`, {
        milestones: proposalMilestones
      });

      alert('Contrato fechado com sucesso!');
    } catch (error) {
      console.error('Erro ao aprovar proposta:', error);
      alert(error.response?.data?.message || 'Falha ao aceitar proposta.');
    } finally {
      setAccepting(null);
    }
  }

  if (loading) return <p style={{ color: '#aaa' }}>Carregando propostas...</p>;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Candidatos & Propostas Recebidas</h3>
      {proposals.length === 0 ? (
        <p style={styles.noData}>Nenhuma proposta recebida até o momento.</p>
      ) : (
        <div style={styles.list}>
          {proposals.map((prop) => (
            <div key={prop.id} style={styles.proposalCard}>
              <div style={styles.cardHeader}>
                <h4 style={{ margin: 0 }}>{prop.freelancer?.name}</h4>
                <span style={styles.priceTag}>R$ {Number(prop.amount).toLocaleString('pt-BR')}</span>
              </div>
              <p style={styles.text}>{prop.coverText}</p>

              <div style={styles.milestonesPreview}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#ff6b00' }}>ETAPAS SUGERIDAS:</h5>
                {prop.milestones?.map((m, i) => (
                  <div key={i} style={styles.previewRow}>
                    <span>{m.title}</span>
                    <strong>R$ {Number(m.amount).toLocaleString('pt-BR')}</strong>
                  </div>
                ))}
              </div>

              <button
                disabled={accepting !== null}
                onClick={() => handleAccept(prop.id, prop.milestones)}
                style={{
                  ...styles.acceptBtn,
                  opacity: accepting === prop.id ? 0.6 : 1,
                  cursor: accepting ? 'not-allowed' : 'pointer'
                }}
              >
                {accepting === prop.id ? 'Processando...' : '🤝 Aceitar Proposta'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { marginTop: '20px', color: '#fff' },
  title: { fontSize: '18px', color: '#ff6b00', marginBottom: '20px' },
  noData: { color: '#666', fontStyle: 'italic' },
  list: { display: 'flex', flexDirection: 'column', gap: '20px' },
  proposalCard: { backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', padding: '20px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  priceTag: { color: '#00c851', fontWeight: 'bold', fontSize: '18px' },
  text: { color: '#ccc', fontSize: '14px', lineHeight: '1.6', margin: '0 0 15px 0' },
  milestonesPreview: { backgroundColor: '#111', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px dashed #333' },
  previewRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#aaa', marginTop: '6px' },
  acceptBtn: { backgroundColor: '#00c851', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '4px', fontWeight: 'bold', width: '100%' }
};