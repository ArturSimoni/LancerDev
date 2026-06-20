import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function MeusAnuncios() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', budget: '', deliveryTime: '' });

  useEffect(() => { fetchMyProjects(); }, []);

  async function fetchMyProjects() {
    try {
      const response = await api.get('/projects/meus-anuncios');
      setProjects(response.data);
    } catch (error) { console.error('Erro ao buscar:', error); }
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir este projeto?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) { alert('Erro ao deletar projeto.'); }
  }

  function handleOpenEdit(project) {
    setEditingProject(project);
    setFormData({ 
      title: project.title, 
      description: project.description, 
      budget: project.budget, 
      deliveryTime: project.deliveryTime || '' 
    });
  }

  // CORREÇÃO BUG 2: removido e.preventDefault() (não é mais um form HTML)
  async function handleSaveEdit() {
    try {
      const response = await api.put(`/projects/${editingProject.id}`, formData);
      setProjects(projects.map(p => p.id === editingProject.id ? response.data : p));
      setEditingProject(null);
    } catch (error) { alert('Erro ao atualizar projeto.'); }
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <h1 style={s.title}>Meus Anúncios</h1>
        
        {loading ? <p style={{color: '#fff'}}>Carregando...</p> : (
          <div style={s.grid}>
            {projects.map((p) => (
              <div key={p.id} style={s.card}>
                <div style={s.cardInfo}>
                  <h3 style={s.cardTitle}>{p.title}</h3>
                  <p style={s.cardDesc}>{p.description} | Prazo: {p.deliveryTime}</p>
                </div>
                <div style={s.actions}>
                  {/* CORREÇÃO BUG 3: rota correta com projectId para o GerenciarPropostas */}
                  <button onClick={() => navigate(`/projetos/${p.id}/propostas`)} style={s.viewBtn}>Ver Propostas</button>
                  <button onClick={() => handleOpenEdit(p)} style={s.editBtn}>Editar</button>
                  <button onClick={() => handleDelete(p.id)} style={s.deleteBtn}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingProject && (
          <div style={s.modalOverlay}>
            {/* CORREÇÃO BUG 2: trocado <form> por <div> — form dentro de iframe/React pode causar reload */}
            <div style={s.modalCard}>
              <h2 style={{color: '#fff', fontSize: '18px', marginBottom: '10px'}}>Editar Projeto</h2>
              <input
                style={s.input}
                placeholder="Título"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
              <textarea
                style={{...s.input, height: '80px', resize: 'none'}}
                placeholder="Descrição"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
              <input
                style={s.input}
                type="number"
                placeholder="Orçamento"
                value={formData.budget}
                onChange={e => setFormData({...formData, budget: e.target.value})}
              />
              <input
                style={s.input}
                placeholder="Prazo de Entrega (ex: 15 dias)"
                value={formData.deliveryTime}
                onChange={e => setFormData({...formData, deliveryTime: e.target.value})}
              />
              
              <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                {/* CORREÇÃO BUG 2: onClick direto em vez de type="submit" */}
                <button onClick={handleSaveEdit} style={s.viewBtn}>Salvar</button>
                <button onClick={() => setEditingProject(null)} style={s.deleteBtn}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '40px 20px', color: '#fff' },
  container: { maxWidth: '1000px', margin: '0 auto' },
  title: { marginBottom: '30px', fontWeight: '700', color: '#fff' },
  grid: { display: 'flex', flexDirection: 'column', gap: '15px' },
  card: { backgroundColor: '#111', padding: '20px', borderRadius: '0px', border: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardInfo: { flex: 2, marginRight: '20px' },
  cardTitle: { margin: '0 0 5px 0', color: '#fff' },
  cardDesc: { color: '#888', fontSize: '14px', margin: 0 },
  actions: { display: 'flex', gap: '10px', flex: 1, justifyContent: 'flex-end' },
  viewBtn: { backgroundColor: '#ff6b00', border: 'none', color: '#000', padding: '10px 16px', borderRadius: '0px', fontWeight: '700', cursor: 'pointer' },
  editBtn: { backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '10px 16px', borderRadius: '0px', cursor: 'pointer' },
  deleteBtn: { backgroundColor: 'transparent', border: '1px solid #444', color: '#ff5555', padding: '10px 16px', borderRadius: '0px', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: '#111', padding: '30px', borderRadius: '0px', width: '400px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #333' },
  input: { padding: '12px', backgroundColor: '#0d0d0d', border: '1px solid #222', borderRadius: '0px', color: '#fff', outline: 'none' }
};