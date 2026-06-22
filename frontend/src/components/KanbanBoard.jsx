import { useState, useEffect } from 'react';
import api from '../services/api';

const COLUMNS = [
  { id: 'pending',     title: 'A Fazer',       color: '#555' },
  { id: 'in_progress', title: 'Desenvolvendo', color: '#ff6b00' },
  { id: 'review',      title: 'Em Revisão',    color: '#33b5e5' },
  { id: 'done',        title: 'Concluído',      color: '#00c851' },
];

export default function KanbanBoard({ projectId, isFreelancer }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(null);

  useEffect(() => {
    if (projectId) loadKanban();
  }, [projectId]);

  async function loadKanban() {
    try {
      const response = await api.get(`/milestones/projeto/${projectId}`);
      setMilestones(response.data);
    } catch (error) {
      console.error('Erro ao carregar Kanban:', error);
    } finally {
      setLoading(false);
    }
  }

  async function moveCard(milestoneId, newStatus) {
    setMoving(milestoneId);
    try {
      await api.patch(`/milestones/${milestoneId}/status`, { status: newStatus });
      setMilestones(prev =>
        prev.map(m => m.id === milestoneId ? { ...m, status: newStatus } : m)
      );
    } catch (error) {
      alert(error.response?.data?.message || 'Não foi possível mover o marco.');
    } finally {
      setMoving(null);
    }
  }

  if (loading) return <p style={{ color: '#aaa' }}>Carregando quadro de marcos...</p>;
  if (milestones.length === 0) return <p style={{ color: '#666', fontStyle: 'italic' }}>Nenhum marco cadastrado para este projeto.</p>;

  return (
    <div style={s.board}>
      {COLUMNS.map((col, colIndex) => {
        const cards = milestones.filter(m => m.status === col.id);
        return (
          <div key={col.id} style={s.column}>
            <div style={s.columnHeader}>
              <span style={{ ...s.dot, backgroundColor: col.color }} />
              <h4 style={s.columnTitle}>{col.title}</h4>
              <span style={s.count}>{cards.length}</span>
            </div>

            <div style={s.cardList}>
              {cards.map(item => (
                <div key={item.id} style={s.card}>
                  <h5 style={s.cardTitle}>{item.title}</h5>
                  {item.description && (
                    <p style={s.cardDesc}>{item.description}</p>
                  )}
                  <span style={s.badge}>
                    R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>

                  {/* Ações do FREELANCER */}
                  {isFreelancer && (
                    <div style={s.actions}>
                      {/* Pode voltar de qualquer coluna exceto pending e review */}
                      {col.id === 'in_progress' && (
                        <button
                          disabled={moving === item.id}
                          onClick={() => moveCard(item.id, 'pending')}
                          style={s.btnBack}
                        >
                          ◀ Voltar
                        </button>
                      )}
                      {/* Pode avançar de pending → in_progress → review */}
                      {(col.id === 'pending' || col.id === 'in_progress') && (
                        <button
                          disabled={moving === item.id}
                          onClick={() => moveCard(item.id, COLUMNS[colIndex + 1].id)}
                          style={{
                            ...s.btnNext,
                            backgroundColor: col.id === 'in_progress' ? '#33b5e5' : '#ff6b00'
                          }}
                        >
                          {moving === item.id ? 'Movendo...' :
                           col.id === 'in_progress' ? 'Enviar p/ Revisão ▶' : 'Iniciar ▶'}
                        </button>
                      )}
                      {/* Em revisão: freelancer só pode voltar se cliente rejeitar */}
                      {col.id === 'review' && (
                        <div style={s.waitingBadge}>⏳ Aguardando aprovação do cliente</div>
                      )}
                    </div>
                  )}

                  {/* Ações do CLIENTE — só aparecem em "Em Revisão" */}
                  {!isFreelancer && col.id === 'review' && (
                    <div style={s.actions}>
                      <button
                        disabled={moving === item.id}
                        onClick={() => moveCard(item.id, 'in_progress')}
                        style={s.btnReject}
                      >
                        ✕ Solicitar Ajuste
                      </button>
                      <button
                        disabled={moving === item.id}
                        onClick={() => moveCard(item.id, 'done')}
                        style={s.btnApprove}
                      >
                        {moving === item.id ? 'Aprovando...' : '✓ Aprovar Marco'}
                      </button>
                    </div>
                  )}

                  {/* Badge de concluído para o cliente nas outras colunas */}
                  {!isFreelancer && col.id === 'done' && (
                    <div style={s.doneBadge}>✅ Aprovado</div>
                  )}
                </div>
              ))}

              {cards.length === 0 && (
                <div style={s.emptyCol}>Nenhum marco aqui</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const s = {
  board: { display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '10px', marginTop: '20px' },
  column: { flex: 1, minWidth: '220px', backgroundColor: '#111', borderRadius: '8px', padding: '14px', border: '1px solid #222', minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '10px' },
  columnHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  dot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  columnTitle: { margin: 0, fontSize: '13px', color: '#fff', fontWeight: '600', flex: 1 },
  count: { backgroundColor: '#222', color: '#aaa', borderRadius: '10px', padding: '1px 7px', fontSize: '11px' },
  cardList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  card: { backgroundColor: '#1e1e1e', border: '1px solid #2d2d2d', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' },
  cardTitle: { margin: 0, fontSize: '13px', color: '#fff', fontWeight: 'bold' },
  cardDesc: { margin: 0, fontSize: '12px', color: '#888', lineHeight: '1.4' },
  badge: { color: '#00c851', fontWeight: 'bold', fontSize: '13px', marginTop: '2px' },
  actions: { display: 'flex', gap: '6px', marginTop: '8px', borderTop: '1px solid #2a2a2a', paddingTop: '8px' },
  btnBack: { flex: 1, backgroundColor: '#2d2d2d', color: '#aaa', border: 'none', borderRadius: '4px', padding: '5px', cursor: 'pointer', fontSize: '11px' },
  btnNext: { flex: 2, color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
  btnReject: { flex: 1, backgroundColor: 'transparent', border: '1px solid #ff5555', color: '#ff5555', borderRadius: '4px', padding: '6px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
  btnApprove: { flex: 2, backgroundColor: '#00c851', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
  waitingBadge: { fontSize: '11px', color: '#33b5e5', fontStyle: 'italic', marginTop: '4px' },
  doneBadge: { fontSize: '11px', color: '#00c851', marginTop: '6px', borderTop: '1px solid #2a2a2a', paddingTop: '6px' },
  emptyCol: { color: '#444', fontSize: '12px', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' },
};