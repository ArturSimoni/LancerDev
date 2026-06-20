import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function BuscarProjetos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]); // para vitrine
  const [project, setProject] = useState(null); // para detalhe
  const [loading, setLoading] = useState(true);
  const [coverText, setCoverText] = useState('');
  const [milestones, setMilestones] = useState([{ title: '', description: '', amount: '' }]);

  const usuarioLogadoId = Number(localStorage.getItem('userId') || 0);

  useEffect(() => {
    if (id) {
      api.get(`/projects/${id}`)
        .then(r => setProject(r.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      api.get('/projects/vitrine')
        .then(r => setProjects(r.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleAddMilestone = () =>
    setMilestones([...milestones, { title: '', description: '', amount: '' }]);

  const handleMilestoneChange = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const totalAmount = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!coverText.trim() || totalAmount <= 0) {
      alert('Preencha a apresentação e adicione pelo menos uma etapa com valor.');
      return;
    }
    try {
      await api.post('/propostas', { projectId: id, coverText, totalAmount, milestones });
      alert('Proposta enviada com sucesso!');
      navigate('/propostas');
    } catch (error) {
      alert('Falha ao enviar proposta. Tente novamente.');
    }
  };

  if (loading) return <p style={{ color: '#fff', padding: '20px' }}>Carregando...</p>;

  if (!id) {
    return (
      <div style={styles.container}>
        <h2 style={styles.sectionTitle}>Projetos Disponíveis</h2>
        {projects.length === 0 ? (
          <p style={{ color: '#666' }}>Nenhum projeto disponível no momento.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {projects.map(p => (
              <div key={p.id} style={styles.projectCard}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>{p.title}</h3>
                  <p style={{ color: '#aaa', fontSize: '14px', margin: '0 0 10px 0' }}>{p.description}</p>
                  <span style={{ color: '#ff6b00', fontWeight: 'bold' }}>
                    Orçamento: R$ {Number(p.budget).toLocaleString('pt-BR')}
                  </span>
                </div>
                <Link to={`/projeto/${p.id}`} style={styles.viewBtn}>Ver Detalhes →</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (project && project.clientId === usuarioLogadoId) {
    navigate(`/projetos/${id}/propostas`);
    return null;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>Propor Cronograma de Desenvolvimento</h2>
      <p style={styles.subtitle}>Divida o escopo em milestones. Cada um vira um card no Kanban e libera o valor ao ser concluído.</p>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Mensagem de Apresentação</label>
        <textarea
          style={styles.textarea}
          placeholder="Diga ao cliente por que você é o desenvolvedor ideal..."
          value={coverText}
          onChange={(e) => setCoverText(e.target.value)}
        />
      </div>

      <h3 style={{ ...styles.label, marginTop: '30px', color: '#ff6b00' }}>📌 Fases do Escopo & Pagamento</h3>

      {milestones.map((milestone, index) => (
        <div key={index} style={styles.milestoneRow}>
          <input type="text" style={{ ...styles.input, flex: 2 }} placeholder="Título da etapa"
            value={milestone.title} onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)} required />
          <input type="text" style={{ ...styles.input, flex: 3 }} placeholder="Breve descrição (Opcional)"
            value={milestone.description} onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)} />
          <input type="number" style={{ ...styles.input, flex: 1 }} placeholder="Valor (R$)"
            value={milestone.amount} onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)} required />
        </div>
      ))}

      <button type="button" onClick={handleAddMilestone} style={styles.addBtn}>+ Adicionar Nova Etapa</button>

      <div style={styles.footerRow}>
        <div>
          <span style={{ color: '#aaa', fontSize: '14px' }}>Orçamento Proposto:</span>
          <h2 style={styles.totalPrice}>R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </div>
        <button onClick={handleSubmitProposal} style={styles.submitBtn}>🚀 Enviar Proposta Oficial</button>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1200px', margin: '40px auto', padding: '0 20px', color: '#fff' },
  sectionTitle: { fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#ff6b00' },
  subtitle: { color: '#aaa', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px' },
  projectCard: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' },
  viewBtn: { backgroundColor: '#ff6b00', color: '#000', padding: '10px 18px', borderRadius: '4px', fontWeight: 'bold', textDecoration: 'none', whiteSpace: 'nowrap' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 'bold', color: '#fff' },
  textarea: { backgroundColor: '#141414', border: '1px solid #222', borderRadius: '6px', color: '#fff', padding: '15px', minHeight: '120px', fontSize: '14px', resize: 'vertical' },
  milestoneRow: { display: 'flex', gap: '15px', marginBottom: '15px' },
  input: { backgroundColor: '#141414', border: '1px solid #222', borderRadius: '6px', color: '#fff', padding: '12px', fontSize: '14px' },
  addBtn: { backgroundColor: 'transparent', border: '1px solid #ff6b00', color: '#ff6b00', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', marginTop: '10px' },
  footerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', borderTop: '1px solid #222', paddingTop: '20px' },
  totalPrice: { color: '#00c851', fontSize: '28px', margin: '5px 0 0 0', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#ff6b00', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }
};