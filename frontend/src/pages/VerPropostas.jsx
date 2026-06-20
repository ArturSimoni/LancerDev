import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function VerPropostas() {
  const { projectId } = useParams();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);

  useEffect(() => {
    async function fetchProposals() {
      try {
        const response = await api.get(`/propostas/projeto/${projectId}`);
        setProposals(response.data);
      } catch (error) {
        console.error('Erro ao buscar propostas:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProposals();
  }, [projectId]);

  // CORRIGIDO: envia milestones junto para o backend criar no Kanban
  async function handleAccept(proposalId, proposalMilestones) {
    if (!window.confirm('Deseja fechar contrato com este desenvolvedor?')) return;
    setAccepting(proposalId);
    try {
      await api.post(`/propostas/${proposalId}/accept`, {
        milestones: proposalMilestones || []
      });
      setProposals(prev =>
        prev.map(p =>
          p.id === proposalId
            ? { ...p, status: 'accepted' }
            : { ...p, status: 'rejected' }
        )
      );
      alert('Contrato fechado! O Kanban foi criado e o chat foi liberado.');
    } catch (error) {
      alert(error.response?.data?.message || 'Falha ao aceitar proposta.');
    } finally {
      setAccepting(null);
    }
  }

  if (loading) return <div style={s.page}>Carregando propostas...</div>;

  return (
    <div style={s.page}>
      <h1 style={s.title}>Propostas Recebidas</h1>
      {proposals.length === 0 ? (
        <div style={s.empty}>Nenhuma proposta recebida para este projeto ainda.</div>
      ) : (
        <div style={s.list}>
          {proposals.map(p => (
            <div key={p.id} style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.name}>{p.freelancer.name}</h3>
                <span style={{
                  ...s.statusBadge,
                  backgroundColor:
                    p.status === 'accepted' ? '#00c85120' :
                    p.status === 'rejected' ? '#ff555520' : '#ff6b0020',
                  color:
                    p.status === 'accepted' ? '#00c851' :
                    p.status === 'rejected' ? '#ff5555' : '#ff6b00',
                }}>
                  {p.status === 'accepted' ? 'Aceito' :
                   p.status === 'rejected' ? 'Recusado' : 'Pendente'}
                </span>
              </div>

              <p style={s.amount}>
                Oferta: R$ {Number(p.amount).toLocaleString('pt-BR')}
              </p>
              <p style={s.text}>{p.coverText}</p>

              {p.milestones?.length > 0 && (
                <div style={s.milestonesBox}>
                  <p style={s.milestonesTitle}>Etapas propostas:</p>
                  {p.milestones.map((m, i) => (
                    <div key={i} style={s.milestoneRow}>
                      <span>{m.title}</span>
                      <strong style={{ color: '#00c851' }}>
                        R$ {Number(m.amount).toLocaleString('pt-BR')}
                      </strong>
                    </div>
                  ))}
                </div>
              )}

              {p.status === 'pending' && (
                <button
                  disabled={accepting !== null}
                  // CORRIGIDO: passa p.milestones para o handleAccept
                  onClick={() => handleAccept(p.id, p.milestones)}
                  style={{
                    ...s.btnAccept,
                    opacity: accepting === p.id ? 0.6 : 1,
                    cursor: accepting !== null ? 'not-allowed' : 'pointer'
                  }}
                >
                  {accepting === p.id ? 'Processando...' : '🤝 Aceitar Proposta'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  page: { maxWidth: '800px', margin: '40px auto', padding: '0 20px', color: '#fff' },
  title: { fontSize: '28px', marginBottom: '20px' },
  empty: { padding: '20px', border: '1px solid #333', borderRadius: '8px', textAlign: 'center', color: '#666' },
  list: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { backgroundColor: '#111', padding: '20px', borderRadius: '8px', border: '1px solid #222' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  name: { margin: 0 },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  amount: { color: '#ff6b00', fontWeight: 'bold', margin: '0 0 8px 0' },
  text: { color: '#aaa', fontSize: '14px', margin: '0 0 12px 0' },
  milestonesBox: { backgroundColor: '#0d0d0d', border: '1px dashed #333', borderRadius: '6px', padding: '12px', marginBottom: '12px' },
  milestonesTitle: { color: '#ff6b00', fontSize: '12px', fontWeight: 'bold', margin: '0 0 8px 0' },
  milestoneRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#aaa', padding: '4px 0' },
  btnAccept: { backgroundColor: '#00c851', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', marginTop: '10px', fontWeight: 'bold', width: '100%' }
};