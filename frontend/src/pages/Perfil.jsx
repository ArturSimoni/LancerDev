import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Perfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const loggedUser = localStorage.getItem('@LancerDev:user')
    ? JSON.parse(localStorage.getItem('@LancerDev:user'))
    : null;

  const targetId = id || loggedUser?.id;
  const isOwn = Number(targetId) === Number(loggedUser?.id);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Formulário de perfil
  const [profileForm, setProfileForm] = useState({});

  // Formulário GitHub
  const [ghForm, setGhForm] = useState({ repoUrl: '', title: '', description: '' });
  const [showGhForm, setShowGhForm] = useState(false);

  // Formulário Experiência
  const [expForm, setExpForm] = useState({ title: '', company: '', startDate: '', endDate: '', description: '' });
  const [showExpForm, setShowExpForm] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [targetId]);

  async function loadProfile() {
    try {
      const response = await api.get(`/perfil/${targetId}`);
      setData(response.data);
      if (response.data.role === 'client') {
        setProfileForm({
          companyName: response.data.profile?.companyName || '',
          companyWebsite: response.data.profile?.companyWebsite || '',
          companyDescription: response.data.profile?.companyDescription || '',
        });
      } else {
        setProfileForm({
          bio: response.data.profile?.bio || '',
          hourlyRate: response.data.profile?.hourlyRate || '',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    try {
      await api.put('/perfil/me', profileForm);
      setEditing(false);
      loadProfile();
    } catch (error) {
      alert('Erro ao salvar perfil.');
    }
  }

  async function handleAddGithub() {
    if (!ghForm.repoUrl.trim()) return alert('Informe a URL do repositório.');
    try {
      await api.post('/perfil/github', ghForm);
      setGhForm({ repoUrl: '', title: '', description: '' });
      setShowGhForm(false);
      loadProfile();
    } catch (error) {
      alert('Erro ao adicionar projeto.');
    }
  }

  async function handleRemoveGithub(ghId) {
    if (!window.confirm('Remover este projeto?')) return;
    try {
      await api.delete(`/perfil/github/${ghId}`);
      loadProfile();
    } catch (error) {
      alert('Erro ao remover projeto.');
    }
  }

  async function handleAddExp() {
    if (!expForm.title.trim()) return alert('Informe o título.');
    try {
      await api.post('/perfil/experiencia', expForm);
      setExpForm({ title: '', company: '', startDate: '', endDate: '', description: '' });
      setShowExpForm(false);
      loadProfile();
    } catch (error) {
      alert('Erro ao adicionar experiência.');
    }
  }

  async function handleRemoveExp(expId) {
    if (!window.confirm('Remover esta experiência?')) return;
    try {
      await api.delete(`/perfil/experiencia/${expId}`);
      loadProfile();
    } catch (error) {
      alert('Erro ao remover experiência.');
    }
  }

  const avgRating = data?.reviews?.length
    ? (data.reviews.reduce((s, r) => s + r.rating, 0) / data.reviews.length).toFixed(1)
    : null;

  if (loading) return <div style={s.page}>Carregando perfil...</div>;
  if (!data) return <div style={s.page}>Perfil não encontrado.</div>;

  return (
    <div style={s.page}>

      {/* Cabeçalho */}
      <div style={s.header}>
        <div style={s.avatar}>{data.name?.[0]?.toUpperCase()}</div>
        <div style={s.headerInfo}>
          <h1 style={s.name}>{data.name}</h1>
          <span style={s.role}>{data.role === 'freelancer' ? '👨‍💻 Freelancer' : '🏢 Cliente'}</span>
          <p style={s.email}>{data.email}</p>
          {avgRating && (
            <p style={s.rating}>⭐ {avgRating} ({data.reviews.length} avaliações)</p>
          )}
          {data.role === 'freelancer' && data.profile?.hourlyRate && (
            <p style={s.hourly}>R$ {Number(data.profile.hourlyRate).toLocaleString('pt-BR')}/hora</p>
          )}
        </div>
        {isOwn && (
          <button onClick={() => setEditing(!editing)} style={s.btnEdit}>
            {editing ? 'Cancelar' : '✏️ Editar Perfil'}
          </button>
        )}
      </div>

      {/* Formulário de edição */}
      {isOwn && editing && (
        <div style={s.card}>
          <h2 style={s.cardTitle}>Editar Informações</h2>
          {data.role === 'client' ? (
            <div style={s.formGrid}>
              <input style={s.input} placeholder="Nome da empresa" value={profileForm.companyName}
                onChange={e => setProfileForm({ ...profileForm, companyName: e.target.value })} />
              <input style={s.input} placeholder="Site da empresa" value={profileForm.companyWebsite}
                onChange={e => setProfileForm({ ...profileForm, companyWebsite: e.target.value })} />
              <textarea style={{ ...s.input, gridColumn: '1/-1', height: '80px', resize: 'none' }}
                placeholder="Descrição da empresa" value={profileForm.companyDescription}
                onChange={e => setProfileForm({ ...profileForm, companyDescription: e.target.value })} />
            </div>
          ) : (
            <div style={s.formGrid}>
              <textarea style={{ ...s.input, gridColumn: '1/-1', height: '80px', resize: 'none' }}
                placeholder="Bio profissional" value={profileForm.bio}
                onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} />
              <input style={s.input} type="number" placeholder="Valor por hora (R$)" value={profileForm.hourlyRate}
                onChange={e => setProfileForm({ ...profileForm, hourlyRate: e.target.value })} />
            </div>
          )}
          <button onClick={handleSaveProfile} style={s.btnSave}>Salvar</button>
        </div>
      )}

      {/* Bio / Descrição */}
      {data.role === 'freelancer' && data.profile?.bio && (
        <div style={s.card}>
          <h2 style={s.cardTitle}>Sobre</h2>
          <p style={s.text}>{data.profile.bio}</p>
        </div>
      )}

      {data.role === 'client' && data.profile?.companyDescription && (
        <div style={s.card}>
          <h2 style={s.cardTitle}>Empresa</h2>
          {data.profile.companyName && <p style={s.boldText}>{data.profile.companyName}</p>}
          {data.profile.companyWebsite && (
            <a href={data.profile.companyWebsite} target="_blank" rel="noreferrer" style={s.link}>
              {data.profile.companyWebsite}
            </a>
          )}
          <p style={s.text}>{data.profile.companyDescription}</p>
        </div>
      )}

      {/* Projetos publicados (cliente) */}
      {data.role === 'client' && (
        <div style={s.card}>
          <h2 style={s.cardTitle}>Projetos Publicados</h2>
          {data.projects?.length === 0 ? (
            <p style={s.empty}>Nenhum projeto publicado ainda.</p>
          ) : (
            data.projects.map(p => (
              <div key={p.id} style={s.listItem}>
                <div>
                  <strong style={{ color: '#fff' }}>{p.title}</strong>
                  <span style={{ ...s.statusBadge, backgroundColor: p.status === 'open' ? '#00c85120' : '#ff6b0020', color: p.status === 'open' ? '#00c851' : '#ff6b00' }}>
                    {p.status === 'open' ? 'Aberto' : p.status === 'in_progress' ? 'Em andamento' : 'Concluído'}
                  </span>
                </div>
                <span style={{ color: '#ff6b00', fontWeight: 'bold' }}>
                  R$ {Number(p.budget).toLocaleString('pt-BR')}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Projetos GitHub (freelancer) */}
      {data.role === 'freelancer' && (
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Projetos no GitHub</h2>
            {isOwn && (
              <button onClick={() => setShowGhForm(!showGhForm)} style={s.btnAdd}>
                {showGhForm ? 'Cancelar' : '+ Adicionar'}
              </button>
            )}
          </div>

          {showGhForm && (
            <div style={s.formGrid}>
              <input style={{ ...s.input, gridColumn: '1/-1' }} placeholder="URL do repositório (ex: https://github.com/user/repo)"
                value={ghForm.repoUrl} onChange={e => setGhForm({ ...ghForm, repoUrl: e.target.value })} />
              <input style={s.input} placeholder="Título do projeto"
                value={ghForm.title} onChange={e => setGhForm({ ...ghForm, title: e.target.value })} />
              <input style={s.input} placeholder="Descrição breve"
                value={ghForm.description} onChange={e => setGhForm({ ...ghForm, description: e.target.value })} />
              <button onClick={handleAddGithub} style={{ ...s.btnSave, gridColumn: '1/-1' }}>Adicionar Projeto</button>
            </div>
          )}

          {data.githubProjects?.length === 0 ? (
            <p style={s.empty}>Nenhum projeto adicionado ainda.</p>
          ) : (
            data.githubProjects.map(gh => (
              <div key={gh.id} style={s.listItem}>
                <div>
                  <a href={gh.repoUrl} target="_blank" rel="noreferrer" style={s.link}>
                    {gh.title || gh.repoUrl}
                  </a>
                  {gh.description && <p style={{ ...s.text, margin: '2px 0 0 0' }}>{gh.description}</p>}
                </div>
                {isOwn && (
                  <button onClick={() => handleRemoveGithub(gh.id)} style={s.btnRemove}>✕</button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Experiências (freelancer) */}
      {data.role === 'freelancer' && (
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Experiências Profissionais</h2>
            {isOwn && (
              <button onClick={() => setShowExpForm(!showExpForm)} style={s.btnAdd}>
                {showExpForm ? 'Cancelar' : '+ Adicionar'}
              </button>
            )}
          </div>

          {showExpForm && (
            <div style={s.formGrid}>
              <input style={s.input} placeholder="Cargo / Título"
                value={expForm.title} onChange={e => setExpForm({ ...expForm, title: e.target.value })} />
              <input style={s.input} placeholder="Empresa"
                value={expForm.company} onChange={e => setExpForm({ ...expForm, company: e.target.value })} />
              <input style={s.input} type="date" placeholder="Início"
                value={expForm.startDate} onChange={e => setExpForm({ ...expForm, startDate: e.target.value })} />
              <input style={s.input} type="date" placeholder="Fim (deixe vazio se atual)"
                value={expForm.endDate} onChange={e => setExpForm({ ...expForm, endDate: e.target.value })} />
              <textarea style={{ ...s.input, gridColumn: '1/-1', height: '70px', resize: 'none' }}
                placeholder="Descrição das atividades"
                value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} />
              <button onClick={handleAddExp} style={{ ...s.btnSave, gridColumn: '1/-1' }}>Adicionar Experiência</button>
            </div>
          )}

          {data.experiences?.length === 0 ? (
            <p style={s.empty}>Nenhuma experiência adicionada ainda.</p>
          ) : (
            data.experiences.map(exp => (
              <div key={exp.id} style={s.listItem}>
                <div>
                  <strong style={{ color: '#fff' }}>{exp.title}</strong>
                  {exp.company && <span style={{ color: '#aaa', marginLeft: '8px' }}>@ {exp.company}</span>}
                  {(exp.startDate || exp.endDate) && (
                    <p style={{ color: '#666', fontSize: '12px', margin: '2px 0' }}>
                      {exp.startDate ? new Date(exp.startDate).getFullYear() : '?'}
                      {' — '}
                      {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Atual'}
                    </p>
                  )}
                  {exp.description && <p style={{ ...s.text, margin: '4px 0 0 0' }}>{exp.description}</p>}
                </div>
                {isOwn && (
                  <button onClick={() => handleRemoveExp(exp.id)} style={s.btnRemove}>✕</button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Avaliações */}
      <div style={s.card}>
        <h2 style={s.cardTitle}>Avaliações Recebidas</h2>
        {data.reviews?.length === 0 ? (
          <p style={s.empty}>Nenhuma avaliação ainda.</p>
        ) : (
          data.reviews.map(r => (
            <div key={r.id} style={s.reviewItem}>
              <div style={s.reviewHeader}>
                <strong style={{ color: '#fff' }}>{r.reviewer.name}</strong>
                <span style={s.stars}>{'⭐'.repeat(r.rating)}</span>
              </div>
              {r.message && <p style={s.text}>{r.message}</p>}
            </div>
          ))
        )}
      </div>

    </div>
  );
}

const s = {
  page: { maxWidth: '800px', margin: '40px auto', padding: '0 20px', color: '#fff' },
  header: { display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '30px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', padding: '24px' },
  avatar: { width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ff6b00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', color: '#000', flexShrink: 0 },
  headerInfo: { flex: 1 },
  name: { fontSize: '24px', margin: '0 0 4px 0' },
  role: { fontSize: '13px', color: '#ff6b00', fontWeight: 'bold' },
  email: { color: '#666', fontSize: '13px', margin: '4px 0' },
  rating: { color: '#ffcc00', fontSize: '13px', margin: '4px 0' },
  hourly: { color: '#00c851', fontWeight: 'bold', fontSize: '14px', margin: '4px 0' },
  btnEdit: { backgroundColor: 'transparent', border: '1px solid #333', color: '#aaa', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', flexShrink: 0 },
  card: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', padding: '24px', marginBottom: '20px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  cardTitle: { fontSize: '16px', fontWeight: 'bold', color: '#ff6b00', margin: 0, borderLeft: '3px solid #ff6b00', paddingLeft: '10px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px', marginTop: '14px' },
  input: { padding: '10px 12px', backgroundColor: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  btnSave: { backgroundColor: '#ff6b00', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  btnAdd: { backgroundColor: 'transparent', border: '1px solid #ff6b00', color: '#ff6b00', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  btnRemove: { backgroundColor: 'transparent', border: '1px solid #444', color: '#ff5555', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', flexShrink: 0 },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid #1a1a1a', gap: '10px' },
  statusBadge: { padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', marginLeft: '8px' },
  reviewItem: { padding: '12px 0', borderBottom: '1px solid #1a1a1a' },
  reviewHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
  stars: { fontSize: '12px' },
  text: { color: '#888', fontSize: '13px', lineHeight: '1.5', margin: 0 },
  boldText: { color: '#fff', fontWeight: 'bold', margin: '0 0 4px 0' },
  link: { color: '#33b5e5', fontSize: '13px', textDecoration: 'none' },
  empty: { color: '#555', fontStyle: 'italic', fontSize: '13px' },
};