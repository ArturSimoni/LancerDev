import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import GerenciarPropostas from './GerenciarPropostas';

export default function BuscarProjetos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const [coverText, setCoverText] = useState('');
  const [milestones, setMilestones] = useState([
    { title: '', description: '', amount: '' }
  ]);

  const usuarioLogadoId = Number(localStorage.getItem('userId') || 0);

  useEffect(() => {
    if (id) {
      async function loadProjectDetails() {
        try {
          const response = await api.get(`/projects/${id}`);
          setProject(response.data);
        } catch (error) {
          console.error('Erro ao carregar detalhes do projeto:', error);
        } finally {
          setLoading(false);
        }
      }
      loadProjectDetails();
    }
  }, [id]);

  const handleAddMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', amount: '' }]);
  };

  const handleMilestoneChange = (index, field, value) => {
    const updatedMilestones = [...milestones];
    updatedMilestones[index][field] = value;
    setMilestones(updatedMilestones);
  };

  const totalAmount = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);

  const handleSubmitProposal = async (e) => {
    e.preventDefault();

    if (!coverText.trim() || totalAmount <= 0) {
      alert('Por favor, preencha a apresentação e adicione pelo menos uma etapa com valor.');
      return;
    }

    try {
      await api.post('/projects/propostas', {
        projectId: id,
        coverText,
        totalAmount,
        milestones
      });

      alert('Proposta enviada com sucesso!');
      navigate('/propostas');
    } catch (error) {
      console.error('Erro ao enviar proposta:', error);
      alert('Falha ao enviar proposta. Tente novamente.');
    }
  };

  if (!id) {
    return <div style={styles.container}><h2>Listagem Geral de Projetos (Vitrine)</h2></div>;
  }

  if (loading) {
    return <p style={{ color: '#fff', padding: '20px' }}>Carregando dados do projeto...</p>;
  }

  if (project && project.clientId === usuarioLogadoId) {
    return (
      <div style={styles.container}>
        <h2 style={styles.sectionTitle}>Painel do Recrutador: {project.title}</h2>
        <p style={{ color: '#aaa', marginBottom: '20px' }}>Status atual: {project.status}</p>
        <GerenciarPropostas projectId={id} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>Propor Cronograma de Desenvolvimento</h2>
      <p style={styles.subtitle}>
        Divida o escopo do projeto em metas entregáveis (Milestones). Cada card se tornará uma tarefa no quadro Kanban e liberará o respectivo valor ao ser concluída.
      </p>

      <form onSubmit={handleSubmitProposal}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Mensagem de Apresentação</label>
          <textarea
            style={styles.textarea}
            placeholder="Diga ao cliente por que você é o desenvolvedor ideal e detalhe sua abordagem técnica..."
            value={coverText}
            onChange={(e) => setCoverText(e.target.value)}
          />
        </div>

        <h3 style={{ ...styles.label, marginTop: '30px', color: '#ff6b00' }}>📌 Fases do Escopo & Pagamento</h3>
        
        {milestones.map((milestone, index) => (
          <div key={index} style={styles.milestoneRow}>
            <input
              type="text"
              style={{ ...styles.input, flex: 2 }}
              placeholder="Título da etapa (Ex: API e Banco de Dados)"
              value={milestone.title}
              onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
              required
            />
            <input
              type="text"
              style={{ ...styles.input, flex: 3 }}
              placeholder="Breve descrição (Opcional)"
              value={milestone.description}
              onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
            />
            <input
              type="number"
              style={{ ...styles.input, flex: 1 }}
              placeholder="Valor (R$)"
              value={milestone.amount}
              onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
              required
            />
          </div>
        ))}

        <button type="button" onClick={handleAddMilestone} style={styles.addBtn}>
          + Adicionar Nova Etapa ao Kanban
        </button>

        <div style={styles.footerRow}>
          <div>
            <span style={{ color: '#aaa', fontSize: '14px' }}>Orçamento Proposto:</span>
            <h2 style={styles.totalPrice}>R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
          <button type="submit" style={styles.submitBtn}>🚀 Enviar Proposta Oficial</button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1200px', margin: '40px auto', padding: '0 20px', color: '#fff' },
  sectionTitle: { fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#ff6b00' },
  subtitle: { color: '#aaa', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px' },
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