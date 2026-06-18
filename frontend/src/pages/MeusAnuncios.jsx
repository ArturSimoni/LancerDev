import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function MeusAnuncios() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editDeliveryTime, setEditDeliveryTime] = useState('');

  useEffect(() => { fetchMyProjects(); }, []);

  async function fetchMyProjects() {
    try {
      const response = await api.get('/projects/meus-anuncios');
      setProjects(response.data);
    } catch (error) { console.error('Erro ao buscar anúncios:', error); }
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir anúncio?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) { alert('Erro ao deletar.'); }
  }

  function handleOpenEdit(project) {
    setEditingProject(project);
    setEditTitle(project.title);
    setEditDescription(project.description);
    setEditBudget(project.budget);
    setEditDeliveryTime(project.deliveryTime || '');
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    try {
      const response = await api.put(`/projects/${editingProject.id}`, {
        title: editTitle, description: editDescription, budget: Number(editBudget), deliveryTime: editDeliveryTime
      });
      setProjects(projects.map(p => p.id === editingProject.id ? response.data : p));
      setEditingProject(null);
    } catch (error) { alert('Erro ao atualizar.'); }
  }

  return (
    <div style={styles.container}>
      <h2>Meus Anúncios</h2>
      <div style={styles.grid}>
        {projects.map((project) => (
          <div key={project.id} style={styles.card}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <div style={styles.actions}>
              <button onClick={() => navigate(`/projetos/${project.id}/propostas`)} style={styles.viewBtn}>Ver Propostas</button>
              <button onClick={() => handleOpenEdit(project)} style={styles.editBtn}>Editar</button>
              <button onClick={() => handleDelete(project.id)} style={styles.deleteBtn}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1200px', margin: '40px auto', padding: '0 20px', color: '#fff' },
  grid: { display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' },
  card: { backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #333' },
  actions: { display: 'flex', gap: '10px', marginTop: '15px' },
  viewBtn: { flex: 1, backgroundColor: '#ff6b00', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' },
  editBtn: { flex: 1, backgroundColor: 'transparent', border: '1px solid #ff6b00', color: '#ff6b00', padding: '8px', borderRadius: '4px', cursor: 'pointer' },
  deleteBtn: { flex: 1, backgroundColor: 'transparent', border: '1px solid #ff3333', color: '#ff3333', padding: '8px', borderRadius: '4px', cursor: 'pointer' }
};