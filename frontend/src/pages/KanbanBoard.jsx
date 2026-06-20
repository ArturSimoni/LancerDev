import { useState, useEffect } from 'react';
import api from '../services/api';

export default function KanbanBoard({ projectId }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { id: 'pending',     title: 'A Fazer 📋' },
    { id: 'in_progress', title: 'Desenvolvendo 💻' },
    { id: 'review',      title: 'Em Revisão 👀' },
    { id: 'done',        title: 'Concluído & Pago 🎉' },
  ];

  async function loadKanbanData() {
    try {
      const response = await api.get(`/milestones/projeto/${projectId}`);
      setMilestones(response.data);
    } catch (error) {
      console.error('Erro ao carregar Kanban:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) loadKanbanData();
  }, [projectId]);

  async function moveCard(milestoneId, newStatus) {
    try {
      await api.patch(`/milestones/${milestoneId}/status`, { status: newStatus });
      setMilestones(prev =>
        prev.map(m => m.id === milestoneId ? { ...m, status: newStatus } : m)
      );
      if (newStatus === 'done') {
        alert('Etapa concluída! O valor será liberado para o Freelancer.');
      }
    } catch (error) {
      console.error('Erro ao mover card:', error);
      alert('Não foi possível mover o card. Tente novamente.');
    }
  }

  if (loading) return <p style={{ color: '#fff' }}>Carregando fluxo de entregas...</p>;

  return (
    <div style={styles.kanbanContainer}>
      <h3 style={styles.boardTitle}>Painel de Evolução do Projeto (Kanban)</h3>

      <div style={styles.boardGrid}>
        {columns.map(col => (
          <div key={col.id} style={styles.kanbanColumn}>
            <h4 style={styles.columnTitle}>{col.title}</h4>

            <div style={styles.cardList}>
              {milestones
                .filter(m => m.status === col.id)
                .map(item => {
                  const colIndex = columns.findIndex(c => c.id === col.id);
                  return (
                    <div key={item.id} style={styles.kanbanCard}>
                      <h5 style={styles.cardHeader}>{item.title}</h5>
                      <p style={styles.cardDescription}>{item.description || 'Sem descrição adicional.'}</p>
                      <div style={styles.cardFooter}>
                        <span style={styles.moneyBadge}>
                          R$ {Number(item.amount).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div style={styles.actionRow}>
                        {col.id !== 'pending' && (
                          <button
                            onClick={() => moveCard(item.id, columns[colIndex - 1].id)}
                            style={styles.arrowBtn}
                          >
                            ◀
                          </button>
                        )}
                        <div style={{ flex: 1 }} />
                        {col.id !== 'done' && (
                          <button
                            onClick={() => moveCard(item.id, columns[colIndex + 1].id)}
                            style={{
                              ...styles.arrowBtn,
                              backgroundColor: col.id === 'review' ? '#00c851' : '#444'
                            }}
                          >
                            {col.id === 'review' ? 'Concluir & Liberar 💸' : '▶'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  kanbanContainer: { marginTop: '40px', fontFamily: 'sans-serif' },
  boardTitle: { color: '#ff6b00', marginBottom: '20px', borderLeft: '4px solid #ff6b00', paddingLeft: '10px' },
  boardGrid: { display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '15px' },
  kanbanColumn: { flex: 1, minWidth: '270px', backgroundColor: '#111', borderRadius: '8px', padding: '15px', border: '1px solid #222', minHeight: '400px' },
  columnTitle: { color: '#fff', margin: '0 0 15px 0', fontSize: '15px', borderBottom: '1px solid #333', paddingBottom: '10px' },
  cardList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  kanbanCard: { backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' },
  cardHeader: { color: '#fff', margin: 0, fontSize: '14px', fontWeight: 'bold' },
  cardDescription: { color: '#aaa', fontSize: '12px', margin: 0, lineHeight: '1.4' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' },
  moneyBadge: { color: '#00c851', fontWeight: 'bold', fontSize: '13px' },
  actionRow: { display: 'flex', marginTop: '8px', borderTop: '1px solid #2d2d2d', paddingTop: '8px', gap: '5px' },
  arrowBtn: { backgroundColor: '#2d2d2d', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' },
};