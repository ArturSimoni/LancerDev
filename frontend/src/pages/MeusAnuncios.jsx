import { useEffect, useState } from 'react';
import api from '../services/api';

export default function MeusAnuncios() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para o Modal de Edição
  const [editingProject, setEditingProject] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editDeliveryTime, setEditDeliveryTime] = useState(''); // 📆 Novo estado para o calendário no modal

  useEffect(() => {
    fetchMyProjects();
  }, []);

  async function fetchMyProjects() {
    try {
      const response = await api.get('/projects/meus-anuncios');
      setProjects(response.data);
    } catch (error) {
      console.error('Erro ao buscar seus anúncios:', error);
    } finally {
      setLoading(false);
    }
  }

  // Ação de Deletar (D)
  async function handleDelete(id) {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente este anúncio?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      alert('Erro ao deletar anúncio.');
    }
  }

  // Preparar para abrir modal de edição (U)
  function handleOpenEdit(project) {
    setEditingProject(project);
    setEditTitle(project.title);
    setEditDescription(project.description);
    setEditBudget(project.budget);
    setEditDeliveryTime(project.deliveryTime || ''); // 📆 Carrega o prazo atual no input ou deixa vazio se for nulo
  }

  // Salvar alteração no Backend (U)
  async function handleSaveEdit(e) {
    e.preventDefault();
    try {
      const response = await api.put(`/projects/${editingProject.id}`, {
        title: editTitle,
        description: editDescription,
        budget: Number(editBudget),
        deliveryTime: editDeliveryTime || null // 🚀 Envia a nova data do calendário para a API
      });
      
      // Atualiza o estado local
      setProjects(projects.map(p => p.id === editingProject.id ? response.data : p));
      setEditingProject(null); // Fecha modal
    } catch (error) {
      alert('Erro ao atualizar anúncio.');
    }
  }

  // Pega a data de hoje para bloquear datas passadas no calendário do modal
  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>Meus Anúncios Publicados</h2>
      <p style={{ color: '#aaa', marginBottom: '30px' }}>Gerencie, edite ou remova as vagas que você abriu na plataforma.</p>

      {loading ? (
        <p>Carregando seus anúncios...</p>
      ) : projects.length === 0 ? (
        <p style={{ color: '#aaa' }}>Você ainda não publicou nenhum anúncio.</p>
      ) : (
        <div style={styles.grid}>
          {projects.map((project) => (
            <div key={project.id} style={styles.card}>
              <div>
                <div style={styles.cardHeader}>
                  <span style={styles.statusBadge}>{project.status}</span>
                  <span style={styles.budget}>R$ {Number(project.budget).toLocaleString('pt-BR')}</span>
                </div>
                <h3 style={styles.projectTitle}>{project.title}</h3>
                <p style={styles.projectDescription}>{project.description}</p>
                
                {/* 📆 Exibição do Prazo formatado no Card */}
                <div style={styles.deliveryBadge}>
                  <strong>Prazo de Entrega:</strong> {project.deliveryTime ? new Date(project.deliveryTime + 'T00:00:00').toLocaleDateString('pt-BR') : 'A combinar'}
                </div>
              </div>
              
              <div style={styles.actions}>
                <button onClick={() => handleOpenEdit(project)} style={styles.editBtn}>Editar</button>
                <button onClick={() => handleDelete(project.id)} style={styles.deleteBtn}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE EDIÇÃO INLINE */}
      {editingProject && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Editar Anúncio</h3>
            <form onSubmit={handleSaveEdit}>
              <div style={styles.inputGroup}>
                <label>Título:</label>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} required style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label>Descrição:</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} required style={{...styles.input, height: '100px'}} />
              </div>
              
              <div style={styles.row}>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label>Orçamento (R$):</label>
                  <input type="number" value={editBudget} onChange={e => setEditBudget(e.target.value)} required style={styles.input} />
                </div>
                
                {/* 📆 Novo Input de Calendário dentro do Modal */}
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label>Prazo Limite:</label>
                  <input 
                    type="date" 
                    value={editDeliveryTime} 
                    onChange={e => setEditDeliveryTime(e.target.value)} 
                    min={hoje} // 🔒 Impede escolher datas retroativas
                    required 
                    style={styles.input} 
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setEditingProject(null)} style={styles.cancelBtn}>Cancelar</button>
                <button type="submit" style={styles.saveBtn}>Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '1200px', margin: '40px auto', padding: '0 20px', color: '#fff' },
  sectionTitle: { fontSize: '26px', marginBottom: '5px', borderLeft: '4px solid #ff6b00', paddingLeft: '10px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' },
  card: { backgroundColor: '#1e1e1e', border: '1px solid #222', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '250px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  statusBadge: { backgroundColor: '#222', color: '#ff6b00', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', textTransform: 'uppercase', border: '1px solid #ff6b00' },
  budget: { fontWeight: 'bold', color: '#00c851' },
  projectTitle: { fontSize: '18px', marginBottom: '10px' },
  projectDescription: { color: '#aaa', fontSize: '14px', lineHeight: '1.4', marginBottom: '15px' },
  deliveryBadge: { fontSize: '13px', color: '#ff6b00', backgroundColor: 'rgba(255, 107, 0, 0.05)', padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(255, 107, 0, 0.1)', marginBottom: '15px' },
  actions: { display: 'flex', gap: '10px', borderTop: '1px solid #222', paddingTop: '15px' },
  editBtn: { flex: 1, backgroundColor: 'transparent', border: '1px solid #ff6b00', color: '#ff6b00', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  deleteBtn: { flex: 1, backgroundColor: 'transparent', border: '1px solid #ff3333', color: '#ff3333', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  row: { display: 'flex', gap: '15px' },

  // Modal Styles
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '530px', border: '1px solid #333', color: '#fff' },
  inputGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', backgroundColor: '#121212', border: '1px solid #333', borderRadius: '4px', color: '#fff', marginTop: '5px', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
  cancelBtn: { backgroundColor: '#333', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' },
  saveBtn: { backgroundColor: '#ff6b00', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};