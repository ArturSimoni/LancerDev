import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function DetalhesProjeto() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coverText, setCoverText] = useState('');
  const [milestones, setMilestones] = useState([
    { title: '', description: '', amount: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await api.get(`/projects/${id}`);
        setProject(response.data);
      } catch (error) {
        console.error('Erro ao buscar detalhes do projeto:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [id]);

  function handleMilestoneChange(index, field, value) {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  }

  function handleAddMilestone() {
    setMilestones([...milestones, { title: '', description: '', amount: '' }]);
  }

  function handleRemoveMilestone(index) {
    if (milestones.length === 1) return; // mínimo 1
    setMilestones(milestones.filter((_, i) => i !== index));
  }

  const totalAmount = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);

  async function handleSubmitProposal() {
    if (!coverText.trim()) {
      alert('Preencha a carta de apresentação.');
      return;
    }
    if (milestones.some(m => !m.title.trim() || !m.amount)) {
      alert('Preencha título e valor de todos os marcos.');
      return;
    }
    if (totalAmount <= 0) {
      alert('O valor total deve ser maior que zero.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/propostas', {
        projectId: id,
        totalAmount,
        coverText,
        milestones
      });
      setSuccess(true);
      setTimeout(() => navigate('/propostas'), 2000);
    } catch (error) {
      console.error('Erro ao enviar proposta:', error);
      alert('Falha ao enviar proposta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={s.page}>Carregando projeto...</div>;
  if (!project) return <div style={s.page}>Projeto não encontrado.</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>{project.title}</h1>
        <span style={s.budget}>
          Orçamento: R$ {Number(project.budget).toLocaleString('pt-BR')}
        </span>
      </div>

      <div style={s.content}>
        <section style={s.card}>
          <h2 style={s.sectionTitle}>Descrição do Projeto</h2>
          <p style={s.desc}>{project.description}</p>
          {project.deliveryTime && (
            <p style={s.deadline}>📅 Prazo: {project.deliveryTime}</p>
          )}
        </section>

        <section style={s.card}>
          <h2 style={s.sectionTitle}>Enviar Proposta</h2>

          {success ? (
            <div style={s.successBox}>✅ Proposta enviada! Redirecionando...</div>
          ) : (
            <div style={s.form}>
              {/* Carta de apresentação */}
              <div style={s.inputGroup}>
                <label style={s.label}>Carta de Apresentação</label>
                <textarea
                  rows="4"
                  value={coverText}
                  onChange={e => setCoverText(e.target.value)}
                  style={s.textarea}
                  placeholder="Descreva por que você é ideal para este projeto..."
                />
              </div>

              {/* Milestones */}
              <div style={s.inputGroup}>
                <label style={s.label}>
                  📌 Marcos de Entrega
                  <span style={s.labelHint}> — divida o projeto em etapas com valor individual</span>
                </label>

                {milestones.map((m, i) => (
                  <div key={i} style={s.milestoneRow}>
                    <div style={s.milestoneIndex}>{i + 1}</div>
                    <div style={s.milestoneFields}>
                      <input
                        style={s.input}
                        placeholder="Título do marco (ex: Tela de login)"
                        value={m.title}
                        onChange={e => handleMilestoneChange(i, 'title', e.target.value)}
                      />
                      <input
                        style={s.input}
                        placeholder="Descrição (opcional)"
                        value={m.description}
                        onChange={e => handleMilestoneChange(i, 'description', e.target.value)}
                      />
                      <input
                        style={{ ...s.input, width: '140px' }}
                        type="number"
                        placeholder="Valor (R$)"
                        value={m.amount}
                        onChange={e => handleMilestoneChange(i, 'amount', e.target.value)}
                      />
                    </div>
                    {milestones.length > 1 && (
                      <button onClick={() => handleRemoveMilestone(i)} style={s.btnRemove}>✕</button>
                    )}
                  </div>
                ))}

                <button onClick={handleAddMilestone} style={s.btnAdd}>
                  + Adicionar Marco
                </button>
              </div>

              {/* Total */}
              <div style={s.totalRow}>
                <span style={s.totalLabel}>Valor Total da Proposta:</span>
                <span style={s.totalValue}>
                  R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                disabled={submitting}
                onClick={handleSubmitProposal}
                style={{ ...s.btnPrimary, opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? 'Enviando...' : '🚀 Enviar Proposta'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const s = {
  page: { maxWidth: '800px', margin: '40px auto', padding: '0 20px', color: '#fff' },
  header: { borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' },
  title: { fontSize: '32px', margin: '0 0 10px 0' },
  budget: { fontSize: '18px', color: '#ff6b00', fontWeight: 'bold' },
  deadline: { color: '#aaa', fontSize: '14px', marginTop: '10px' },
  content: { display: 'flex', flexDirection: 'column', gap: '30px' },
  card: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', padding: '30px' },
  sectionTitle: { fontSize: '20px', margin: '0 0 20px 0', borderLeft: '3px solid #ff6b00', paddingLeft: '10px' },
  desc: { color: '#aaa', lineHeight: '1.6', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '14px', color: '#fff', fontWeight: 'bold' },
  labelHint: { color: '#666', fontWeight: 'normal', fontSize: '12px' },
  input: { padding: '10px 12px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#0d0d0d', color: '#fff', fontSize: '14px', outline: 'none' },
  textarea: { padding: '12px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#0d0d0d', color: '#fff', resize: 'vertical', fontSize: '14px', outline: 'none' },
  milestoneRow: { display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#0d0d0d', border: '1px solid #222', borderRadius: '6px', padding: '12px' },
  milestoneIndex: { color: '#ff6b00', fontWeight: 'bold', fontSize: '14px', minWidth: '20px', paddingTop: '10px' },
  milestoneFields: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  btnRemove: { backgroundColor: 'transparent', border: '1px solid #444', color: '#ff5555', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', marginTop: '8px' },
  btnAdd: { backgroundColor: 'transparent', border: '1px dashed #ff6b00', color: '#ff6b00', borderRadius: '6px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0d0d0d', border: '1px solid #222', borderRadius: '6px', padding: '14px 16px' },
  totalLabel: { color: '#aaa', fontSize: '14px' },
  totalValue: { color: '#00c851', fontWeight: 'bold', fontSize: '20px' },
  btnPrimary: { backgroundColor: '#ff6b00', color: '#000', padding: '14px', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  successBox: { backgroundColor: 'rgba(0, 200, 80, 0.1)', color: '#00c851', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #00c851' }
};