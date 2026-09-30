import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function Perfil() {
  const { id } = useParams();

  const loggedUser = localStorage.getItem('@LancerDev:user')
    ? JSON.parse(localStorage.getItem('@LancerDev:user'))
    : null;

  const targetId = id || loggedUser?.id;
  const isOwn = Number(targetId) === Number(loggedUser?.id);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [profileForm, setProfileForm] = useState({});
  const [ghForm, setGhForm] = useState({ repoUrl: '', title: '', description: '' });
  const [showGhForm, setShowGhForm] = useState(false);

  const [expForm, setExpForm] = useState({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [showExpForm, setShowExpForm] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [targetId]);

  async function loadProfile() {
    try {
      const response = await api.get(`/perfil/publico/${targetId}`);
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
      setExpForm({
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        description: ''
      });
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

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.feedback}>
          <div style={styles.spinner} />
          <p style={styles.feedbackText}>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>👤</div>
          <h2 style={styles.emptyTitle}>Perfil não encontrado</h2>
          <p style={styles.emptyText}>
            Não foi possível localizar as informações deste usuário.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <span style={styles.sectionLabel}>LANCERDEV / PERFIL</span>
          <h1 style={styles.pageTitle}>
            {isOwn ? 'Meu perfil' : 'Perfil do usuário'}
          </h1>
          <p style={styles.pageSubtitle}>
            {isOwn
              ? 'Gerencie suas informações e apresente seu trabalho.'
              : 'Confira as informações e experiências deste usuário.'}
          </p>
        </div>
      </div>

      <div style={styles.profileHeader}>
        <div style={styles.profileAccent} />

        <div style={styles.profileHeaderContent}>
          <div style={styles.avatar}>
            {data.name?.[0]?.toUpperCase()}
          </div>

          <div style={styles.headerInfo}>
            <span style={styles.roleBadge}>
              {data.role === 'freelancer' ? '👨‍💻 Freelancer' : '🏢 Cliente'}
            </span>

            <h2 style={styles.name}>{data.name}</h2>
            <p style={styles.email}>{data.email}</p>

            {avgRating && (
              <p style={styles.rating}>
                ⭐ {avgRating}
                <span style={styles.ratingCount}>
                  ({data.reviews.length} avaliações)
                </span>
              </p>
            )}

            {data.role === 'freelancer' && data.profile?.hourlyRate && (
              <p style={styles.hourly}>
                R$ {Number(data.profile.hourlyRate).toLocaleString('pt-BR')}/hora
              </p>
            )}
          </div>

          {isOwn && (
            <button
              onClick={() => setEditing(!editing)}
              style={styles.btnEdit}
            >
              {editing ? 'Cancelar' : '✏️ Editar Perfil'}
            </button>
          )}
        </div>
      </div>

      {isOwn && editing && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <span style={styles.sectionLabel}>CONFIGURAÇÕES</span>
              <h2 style={styles.cardTitle}>Editar Informações</h2>
            </div>
          </div>

          {data.role === 'client' ? (
            <div style={styles.formGrid}>
              <input
                style={styles.input}
                placeholder="Nome da empresa"
                value={profileForm.companyName}
                onChange={e => setProfileForm({
                  ...profileForm,
                  companyName: e.target.value
                })}
              />

              <input
                style={styles.input}
                placeholder="Site da empresa"
                value={profileForm.companyWebsite}
                onChange={e => setProfileForm({
                  ...profileForm,
                  companyWebsite: e.target.value
                })}
              />

              <textarea
                style={styles.textareaFull}
                placeholder="Descrição da empresa"
                value={profileForm.companyDescription}
                onChange={e => setProfileForm({
                  ...profileForm,
                  companyDescription: e.target.value
                })}
              />
            </div>
          ) : (
            <div style={styles.formGrid}>
              <textarea
                style={styles.textareaFull}
                placeholder="Bio profissional"
                value={profileForm.bio}
                onChange={e => setProfileForm({
                  ...profileForm,
                  bio: e.target.value
                })}
              />

              <input
                style={styles.input}
                type="number"
                placeholder="Valor por hora (R$)"
                value={profileForm.hourlyRate}
                onChange={e => setProfileForm({
                  ...profileForm,
                  hourlyRate: e.target.value
                })}
              />
            </div>
          )}

          <div style={styles.formActions}>
            <button onClick={handleSaveProfile} style={styles.btnPrimary}>
              Salvar alterações
            </button>
          </div>
        </div>
      )}

      {data.role === 'freelancer' && data.profile?.bio && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <span style={styles.titleIcon}>✦</span>
            Sobre
          </h2>
          <p style={styles.text}>{data.profile.bio}</p>
        </div>
      )}

      {data.role === 'client' && data.profile?.companyDescription && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <span style={styles.titleIcon}>▣</span>
            Empresa
          </h2>

          {data.profile.companyName && (
            <p style={styles.boldText}>{data.profile.companyName}</p>
          )}

          {data.profile.companyWebsite && (
            <a
              href={data.profile.companyWebsite}
              target="_blank"
              rel="noreferrer"
              style={styles.link}
            >
              {data.profile.companyWebsite}
            </a>
          )}

          <p style={styles.text}>{data.profile.companyDescription}</p>
        </div>
      )}

      {data.role === 'client' && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <span style={styles.titleIcon}>▤</span>
            Projetos Publicados
          </h2>

          {data.projects?.length === 0 ? (
            <p style={styles.empty}>Nenhum projeto publicado ainda.</p>
          ) : (
            <div style={styles.list}>
              {data.projects.map(p => (
                <div key={p.id} style={styles.listItem}>
                  <div style={styles.projectInfo}>
                    <strong style={styles.projectTitle}>{p.title}</strong>

                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: p.status === 'open' ? '#00c85120' : '#ff6b0020',
                        color: p.status === 'open' ? '#00c851' : '#ff6b00'
                      }}
                    >
                      {p.status === 'open'
                        ? 'Aberto'
                        : p.status === 'in_progress'
                          ? 'Em andamento'
                          : 'Concluído'}
                    </span>
                  </div>

                  <span style={styles.priceTag}>
                    R$ {Number(p.budget).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {data.role === 'freelancer' && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              <span style={styles.titleIcon}>⌘</span>
              Projetos no GitHub
            </h2>

            {isOwn && (
              <button
                onClick={() => setShowGhForm(!showGhForm)}
                style={styles.btnAdd}
              >
                {showGhForm ? 'Cancelar' : '+ Adicionar'}
              </button>
            )}
          </div>

          {showGhForm && (
            <div style={styles.formBox}>
              <div style={styles.formGrid}>
                <input
                  style={styles.inputFull}
                  placeholder="URL do repositório (ex: https://github.com/user/repo)"
                  value={ghForm.repoUrl}
                  onChange={e => setGhForm({
                    ...ghForm,
                    repoUrl: e.target.value
                  })}
                />

                <input
                  style={styles.input}
                  placeholder="Título do projeto"
                  value={ghForm.title}
                  onChange={e => setGhForm({
                    ...ghForm,
                    title: e.target.value
                  })}
                />

                <input
                  style={styles.input}
                  placeholder="Descrição breve"
                  value={ghForm.description}
                  onChange={e => setGhForm({
                    ...ghForm,
                    description: e.target.value
                  })}
                />

                <button
                  onClick={handleAddGithub}
                  style={styles.btnPrimaryFull}
                >
                  Adicionar Projeto
                </button>
              </div>
            </div>
          )}

          {data.githubProjects?.length === 0 ? (
            <p style={styles.empty}>Nenhum projeto adicionado ainda.</p>
          ) : (
            <div style={styles.list}>
              {data.githubProjects.map(gh => (
                <div key={gh.id} style={styles.listItem}>
                  <div style={styles.itemContent}>
                    <a
                      href={gh.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.link}
                    >
                      {gh.title || gh.repoUrl}
                    </a>

                    {gh.description && (
                      <p style={styles.itemDescription}>{gh.description}</p>
                    )}
                  </div>

                  {isOwn && (
                    <button
                      onClick={() => handleRemoveGithub(gh.id)}
                      style={styles.btnRemove}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {data.role === 'freelancer' && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              <span style={styles.titleIcon}>▤</span>
              Experiências Profissionais
            </h2>

            {isOwn && (
              <button
                onClick={() => setShowExpForm(!showExpForm)}
                style={styles.btnAdd}
              >
                {showExpForm ? 'Cancelar' : '+ Adicionar'}
              </button>
            )}
          </div>

          {showExpForm && (
            <div style={styles.formBox}>
              <div style={styles.formGrid}>
                <input
                  style={styles.input}
                  placeholder="Cargo / Título"
                  value={expForm.title}
                  onChange={e => setExpForm({
                    ...expForm,
                    title: e.target.value
                  })}
                />

                <input
                  style={styles.input}
                  placeholder="Empresa"
                  value={expForm.company}
                  onChange={e => setExpForm({
                    ...expForm,
                    company: e.target.value
                  })}
                />

                <label style={styles.fieldLabel}>
                  Data de início
                  <input
                    style={styles.input}
                    type="date"
                    value={expForm.startDate}
                    onChange={e => setExpForm({
                      ...expForm,
                      startDate: e.target.value
                    })}
                  />
                </label>

                <label style={styles.fieldLabel}>
                  Data de término
                  <input
                    style={styles.input}
                    type="date"
                    value={expForm.endDate}
                    onChange={e => setExpForm({
                      ...expForm,
                      endDate: e.target.value
                    })}
                  />
                </label>

                <textarea
                  style={styles.textareaFull}
                  placeholder="Descrição das atividades"
                  value={expForm.description}
                  onChange={e => setExpForm({
                    ...expForm,
                    description: e.target.value
                  })}
                />

                <button
                  onClick={handleAddExp}
                  style={styles.btnPrimaryFull}
                >
                  Adicionar Experiência
                </button>
              </div>
            </div>
          )}

          {data.experiences?.length === 0 ? (
            <p style={styles.empty}>Nenhuma experiência adicionada ainda.</p>
          ) : (
            <div style={styles.list}>
              {data.experiences.map(exp => (
                <div key={exp.id} style={styles.listItem}>
                  <div style={styles.itemContent}>
                    <strong style={styles.projectTitle}>{exp.title}</strong>

                    {exp.company && (
                      <span style={styles.companyName}>
                        @ {exp.company}
                      </span>
                    )}

                    {(exp.startDate || exp.endDate) && (
                      <p style={styles.dateText}>
                        {exp.startDate ? new Date(exp.startDate).getFullYear() : '?'}
                        {' — '}
                        {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Atual'}
                      </p>
                    )}

                    {exp.description && (
                      <p style={styles.itemDescription}>{exp.description}</p>
                    )}
                  </div>

                  {isOwn && (
                    <button
                      onClick={() => handleRemoveExp(exp.id)}
                      style={styles.btnRemove}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>
            <span style={styles.titleIcon}>★</span>
            Avaliações Recebidas
          </h2>

          <span style={styles.reviewCount}>
            {data.reviews?.length || 0}
          </span>
        </div>

        {data.reviews?.length === 0 ? (
          <p style={styles.empty}>Nenhuma avaliação ainda.</p>
        ) : (
          <div style={styles.list}>
            {data.reviews.map(r => (
              <div key={r.id} style={styles.reviewItem}>
                <div style={styles.reviewHeader}>
                  <strong style={styles.reviewerName}>
                    {r.reviewer.name}
                  </strong>

                  <span style={styles.stars}>
                    {'⭐'.repeat(r.rating)}
                  </span>
                </div>

                {r.message && (
                  <p style={styles.text}>{r.message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '0 20px 40px',
    boxSizing: 'border-box',
    color: '#fff'
  },

  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },

  sectionLabel: {
    display: 'block',
    color: '#ff6b00',
    fontSize: '11px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    marginBottom: '8px'
  },

  pageTitle: {
    color: '#fff',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 6px'
  },

  pageSubtitle: {
    color: '#888',
    fontSize: '14px',
    margin: 0,
    lineHeight: '1.5'
  },

  profileHeader: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
    border: '1px solid #333',
    borderRadius: '10px',
    marginBottom: '20px'
  },

  profileAccent: {
    height: '5px',
    width: '100%',
    background: 'linear-gradient(90deg, #ff6b00, #ff9a3c, transparent)'
  },

  profileHeaderContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '22px',
    padding: '28px',
    flexWrap: 'wrap'
  },

  avatar: {
    width: '76px',
    height: '76px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #ff8a00, #ff6b00)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#111',
    flexShrink: 0
  },

  headerInfo: {
    flex: 1,
    minWidth: '180px'
  },

  roleBadge: {
    display: 'inline-block',
    backgroundColor: '#ff6b0018',
    border: '1px solid #ff6b0040',
    color: '#ff8a32',
    borderRadius: '20px',
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },

  name: {
    color: '#fff',
    fontSize: '25px',
    fontWeight: 'bold',
    margin: '0 0 4px'
  },

  email: {
    color: '#777',
    fontSize: '13px',
    margin: '0 0 8px',
    overflowWrap: 'anywhere'
  },

  rating: {
    color: '#ffcc00',
    fontSize: '13px',
    margin: '6px 0'
  },

  ratingCount: {
    color: '#888',
    marginLeft: '5px'
  },

  hourly: {
    color: '#00c851',
    fontWeight: 'bold',
    fontSize: '14px',
    margin: '7px 0 0'
  },

  btnEdit: {
    backgroundColor: 'transparent',
    border: '1px solid #444',
    color: '#ddd',
    padding: '10px 15px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    flexShrink: 0
  },

  card: {
    backgroundColor: '#1e1e1e',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '20px',
    boxSizing: 'border-box'
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
    flexWrap: 'wrap'
  },

  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#ff6b00',
    fontSize: '17px',
    fontWeight: 'bold',
    margin: 0
  },

  titleIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    backgroundColor: '#ff6b0018',
    color: '#ff8a32',
    fontSize: '16px'
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
    gap: '12px',
    marginTop: '16px'
  },

  input: {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    padding: '11px 13px',
    backgroundColor: '#121212',
    border: '1px solid #383838',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none'
  },

  inputFull: {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    gridColumn: '1 / -1',
    padding: '11px 13px',
    backgroundColor: '#121212',
    border: '1px solid #383838',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none'
  },

  textareaFull: {
    width: '100%',
    minWidth: 0,
    minHeight: '90px',
    boxSizing: 'border-box',
    gridColumn: '1 / -1',
    padding: '11px 13px',
    backgroundColor: '#121212',
    border: '1px solid #383838',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit'
  },

  fieldLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    color: '#888',
    fontSize: '12px'
  },

  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '16px'
  },

  btnPrimary: {
    backgroundColor: '#ff6b00',
    color: '#111',
    border: 'none',
    padding: '11px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px'
  },

  btnPrimaryFull: {
    gridColumn: '1 / -1',
    backgroundColor: '#ff6b00',
    color: '#111',
    border: 'none',
    padding: '11px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px'
  },

  btnAdd: {
    backgroundColor: 'transparent',
    border: '1px solid #ff6b00',
    color: '#ff8a32',
    padding: '7px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  },

  btnRemove: {
    backgroundColor: 'transparent',
    border: '1px solid #444',
    color: '#ff5555',
    borderRadius: '5px',
    padding: '5px 9px',
    cursor: 'pointer',
    fontSize: '12px',
    flexShrink: 0
  },

  formBox: {
    backgroundColor: '#181818',
    border: '1px solid #3a2a20',
    borderRadius: '7px',
    padding: '16px',
    marginBottom: '18px'
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },

  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '15px',
    backgroundColor: '#181818',
    border: '1px solid #2d2d2d',
    borderRadius: '7px',
    boxSizing: 'border-box'
  },

  projectInfo: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    minWidth: 0
  },

  projectTitle: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold',
    overflowWrap: 'anywhere'
  },

  statusBadge: {
    display: 'inline-block',
    padding: '4px 9px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },

  priceTag: {
    color: '#ff8a32',
    fontSize: '14px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },

  itemContent: {
    flex: 1,
    minWidth: 0
  },

  itemDescription: {
    color: '#888',
    fontSize: '13px',
    lineHeight: '1.5',
    margin: '7px 0 0',
    overflowWrap: 'anywhere'
  },

  companyName: {
    color: '#aaa',
    fontSize: '13px',
    marginLeft: '8px'
  },

  dateText: {
    color: '#666',
    fontSize: '12px',
    margin: '7px 0 0'
  },

  text: {
    color: '#aaa',
    fontSize: '13px',
    lineHeight: '1.7',
    margin: '12px 0 0',
    whiteSpace: 'pre-line',
    overflowWrap: 'anywhere'
  },

  boldText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '15px',
    margin: '0 0 7px'
  },

  link: {
    display: 'inline-block',
    color: '#33b5e5',
    fontSize: '13px',
    textDecoration: 'none',
    overflowWrap: 'anywhere',
    marginBottom: '5px'
  },

  empty: {
    color: '#666',
    fontStyle: 'italic',
    fontSize: '13px',
    textAlign: 'center',
    padding: '22px 10px',
    margin: 0,
    backgroundColor: '#181818',
    border: '1px dashed #333',
    borderRadius: '6px'
  },

  reviewCount: {
    backgroundColor: '#292929',
    color: '#aaa',
    borderRadius: '20px',
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: 'bold'
  },

  reviewItem: {
    padding: '15px',
    backgroundColor: '#181818',
    border: '1px solid #2d2d2d',
    borderRadius: '7px'
  },

  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '8px'
  },

  reviewerName: {
    color: '#fff',
    fontSize: '13px'
  },

  stars: {
    fontSize: '12px',
    whiteSpace: 'nowrap'
  },

  feedback: {
    minHeight: '50vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px'
  },

  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #333',
    borderTop: '3px solid #ff6b00',
    borderRadius: '50%'
  },

  feedbackText: {
    color: '#aaa',
    fontSize: '14px'
  },

  emptyState: {
    backgroundColor: '#1e1e1e',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '40px 20px',
    marginTop: '40px',
    textAlign: 'center'
  },

  emptyIcon: {
    fontSize: '32px',
    marginBottom: '12px'
  },

  emptyTitle: {
    color: '#fff',
    fontSize: '20px',
    margin: '0 0 8px'
  },

  emptyText: {
    color: '#777',
    fontSize: '13px',
    margin: 0
  }
};