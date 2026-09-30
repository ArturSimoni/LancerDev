import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function MeusAnuncios() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deliveryTime: ''
  });

  useEffect(() => {
    fetchMyProjects();
  }, []);

  async function fetchMyProjects() {
    try {
      const response = await api.get('/projects/meus-anuncios');
      setProjects(response.data);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Tem certeza de que deseja excluir este projeto?')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.delete(`/projects/${id}`);
      setProjects(current => current.filter(project => project.id !== id));
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      alert('Não foi possível excluir o projeto. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleOpenEdit(project) {
    setEditingProject(project);
    setFormData({
      title: project.title || '',
      description: project.description || '',
      budget: project.budget ?? '',
      deliveryTime: project.deliveryTime || ''
    });
  }

  function handleCloseEdit() {
    if (saving) return;
    setEditingProject(null);
  }

  async function handleSaveEdit() {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Preencha o título e a descrição do projeto.');
      return;
    }

    if (!formData.budget || Number(formData.budget) <= 0) {
      alert('Informe um orçamento válido.');
      return;
    }

    try {
      setSaving(true);

      const response = await api.put(
        `/projects/${editingProject.id}`,
        formData
      );

      setProjects(current =>
        current.map(project =>
          project.id === editingProject.id ? response.data : project
        )
      );

      setEditingProject(null);
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      alert('Não foi possível atualizar o projeto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  return (
    <main className="my-projects-page">
      <style>{styles}</style>

      <div className="my-projects-container">
        <header className="my-projects-header">
          <div>
            <span className="my-projects-eyebrow">ÁREA DO CLIENTE</span>
            <h1>Meus anúncios</h1>
            <p>
              Gerencie seus projetos publicados e acompanhe as propostas
              recebidas dos profissionais.
            </p>
          </div>

          <div className="my-projects-count">
            <span>{projects.length}</span>
            <small>{projects.length === 1 ? 'Projeto publicado' : 'Projetos publicados'}</small>
          </div>
        </header>

        {loading ? (
          <div className="my-projects-loading">
            <div className="my-projects-spinner" />
            <p>Carregando seus anúncios...</p>
          </div>
        ) : projects.length === 0 ? (
          <section className="my-projects-empty">
            <div className="my-projects-empty-icon">▤</div>
            <h2>Você ainda não possui anúncios</h2>
            <p>
              Quando publicar um projeto, ele aparecerá aqui para que você
              possa gerenciar as propostas recebidas.
            </p>
            <button
              type="button"
              className="my-projects-primary-button"
              onClick={() => navigate('/criar-projeto')}
            >
              Criar projeto <span>→</span>
            </button>
          </section>
        ) : (
          <section className="my-projects-list">
            <div className="my-projects-list-heading">
              <h2>Seus projetos</h2>
              <span>{projects.length} anúncios</span>
            </div>

            {projects.map(project => (
              <article className="my-project-card" key={project.id}>
                <div className="my-project-content">
                  <div className="my-project-card-top">
                    <span className="my-project-tag">Projeto publicado</span>
                    <span className="my-project-id">#{project.id}</span>
                  </div>

                  <h3>{project.title}</h3>

                  <p className="my-project-description">
                    {project.description || 'Nenhuma descrição informada.'}
                  </p>

                  <div className="my-project-details">
                    <div className="my-project-detail">
                      <span className="my-project-detail-icon">R$</span>
                      <div>
                        <small>Orçamento</small>
                        <strong>{formatCurrency(project.budget)}</strong>
                      </div>
                    </div>

                    <div className="my-project-detail">
                      <span className="my-project-detail-icon">◷</span>
                      <div>
                        <small>Prazo de entrega</small>
                        <strong>{project.deliveryTime || 'Não informado'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="my-project-actions">
                  <button
                    type="button"
                    className="my-project-proposals-button"
                    onClick={() => navigate(`/projetos/${project.id}/propostas`)}
                  >
                    Ver propostas <span>→</span>
                  </button>

                  <button
                    type="button"
                    className="my-project-edit-button"
                    onClick={() => handleOpenEdit(project)}
                  >
                    <span>✎</span> Editar
                  </button>

                  <button
                    type="button"
                    className="my-project-delete-button"
                    onClick={() => handleDelete(project.id)}
                    disabled={deletingId === project.id}
                  >
                    {deletingId === project.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {editingProject && (
        <div
          className="my-project-modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              handleCloseEdit();
            }
          }}
        >
          <section
            className="my-project-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-project-title"
          >
            <div className="my-project-modal-header">
              <div>
                <span className="my-projects-eyebrow">GERENCIAMENTO</span>
                <h2 id="edit-project-title">Editar projeto</h2>
                <p>Atualize as informações do seu anúncio.</p>
              </div>

              <button
                type="button"
                className="my-project-modal-close"
                onClick={handleCloseEdit}
                disabled={saving}
                aria-label="Fechar modal"
              >
                ×
              </button>
            </div>

            <div className="my-project-modal-body">
              <div className="my-project-form-field">
                <label htmlFor="project-title">Título do projeto</label>
                <input
                  id="project-title"
                  type="text"
                  placeholder="Ex.: Desenvolvimento de plataforma web"
                  value={formData.title}
                  onChange={event =>
                    setFormData({ ...formData, title: event.target.value })
                  }
                />
              </div>

              <div className="my-project-form-field">
                <label htmlFor="project-description">Descrição</label>
                <textarea
                  id="project-description"
                  placeholder="Descreva o que precisa ser desenvolvido..."
                  value={formData.description}
                  onChange={event =>
                    setFormData({ ...formData, description: event.target.value })
                  }
                  rows={5}
                />
              </div>

              <div className="my-project-form-grid">
                <div className="my-project-form-field">
                  <label htmlFor="project-budget">Orçamento (R$)</label>
                  <input
                    id="project-budget"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Ex.: 1500"
                    value={formData.budget}
                    onChange={event =>
                      setFormData({ ...formData, budget: event.target.value })
                    }
                  />
                </div>

                <div className="my-project-form-field">
                  <label htmlFor="project-delivery">Prazo de entrega</label>
                  <input
                    id="project-delivery"
                    type="text"
                    placeholder="Ex.: 15 dias"
                    value={formData.deliveryTime}
                    onChange={event =>
                      setFormData({ ...formData, deliveryTime: event.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="my-project-modal-actions">
              <button
                type="button"
                className="my-project-cancel-button"
                onClick={handleCloseEdit}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="my-project-save-button"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar alterações'}
                {!saving && <span>→</span>}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

const styles = `
  .my-projects-page {
    min-height: 100vh;
    padding: 48px 20px 70px;
    background: #090909;
    color: #f5f5f5;
  }

  .my-projects-container {
    width: min(1080px, 100%);
    margin: 0 auto;
  }

  .my-projects-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 38px;
    padding: 30px 32px;
    border: 1px solid #292929;
    border-radius: 17px;
    background:
      radial-gradient(circle at 90% 10%, rgba(255, 107, 0, .15), transparent 35%),
      #111;
  }

  .my-projects-eyebrow {
    display: inline-block;
    margin-bottom: 10px;
    color: #ff8739;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2px;
  }

  .my-projects-header h1 {
    margin: 0;
    color: #fff;
    font-size: clamp(28px, 4vw, 38px);
    letter-spacing: -1px;
  }

  .my-projects-header p {
    max-width: 590px;
    margin: 10px 0 0;
    color: #999;
    font-size: 14px;
    line-height: 1.7;
  }

  .my-projects-count {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 0 0 115px;
    min-height: 100px;
    border: 1px solid rgba(255, 107, 0, .3);
    border-radius: 14px;
    background: rgba(255, 107, 0, .08);
  }

  .my-projects-count span {
    color: #ff8739;
    font-size: 32px;
    font-weight: 800;
  }

  .my-projects-count small {
    color: #aaa;
    font-size: 10px;
    text-align: center;
  }

  .my-projects-list-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .my-projects-list-heading h2 {
    margin: 0;
    color: #fff;
    font-size: 19px;
  }

  .my-projects-list-heading span {
    color: #888;
    font-size: 12px;
  }

  .my-projects-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .my-project-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 26px;
    padding: 24px;
    border: 1px solid #292929;
    border-radius: 14px;
    background: linear-gradient(135deg, #151515, #101010);
    transition: border-color .2s ease, transform .2s ease;
  }

  .my-project-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 107, 0, .45);
  }

  .my-project-content {
    flex: 1;
    min-width: 0;
  }

  .my-project-card-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 13px;
  }

  .my-project-tag {
    padding: 6px 10px;
    border-radius: 20px;
    background: rgba(0, 201, 133, .1);
    color: #00c985;
    font-size: 10px;
    font-weight: 700;
  }

  .my-project-id {
    color: #666;
    font-size: 11px;
  }

  .my-project-card h3 {
    margin: 0 0 8px;
    color: #fff;
    font-size: 19px;
    line-height: 1.4;
  }

  .my-project-description {
    display: -webkit-box;
    overflow: hidden;
    max-width: 650px;
    margin: 0;
    color: #999;
    font-size: 13px;
    line-height: 1.7;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .my-project-details {
    display: flex;
    flex-wrap: wrap;
    gap: 26px;
    margin-top: 20px;
  }

  .my-project-detail {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .my-project-detail-icon {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border: 1px solid #303030;
    border-radius: 9px;
    background: #1b1b1b;
    color: #ff8739;
    font-size: 11px;
    font-weight: 800;
  }

  .my-project-detail small,
  .my-project-detail strong {
    display: block;
  }

  .my-project-detail small {
    margin-bottom: 4px;
    color: #777;
    font-size: 10px;
  }

  .my-project-detail strong {
    color: #ddd;
    font-size: 12px;
  }

  .my-project-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 0 0 155px;
  }

  .my-project-actions button {
    min-height: 38px;
    padding: 0 12px;
    border-radius: 7px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 700;
    transition: background .2s ease, border-color .2s ease, transform .2s ease;
  }

  .my-project-actions button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .my-project-proposals-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px solid #ff6b00;
    background: #ff6b00;
    color: #111;
  }

  .my-project-proposals-button:hover {
    background: #ff812b;
  }

  .my-project-edit-button {
    border: 1px solid #383838;
    background: #1b1b1b;
    color: #ddd;
  }

  .my-project-edit-button:hover {
    border-color: #666;
    background: #242424;
  }

  .my-project-delete-button {
    border: 1px solid #492929;
    background: transparent;
    color: #e17b7b;
  }

  .my-project-delete-button:hover:not(:disabled) {
    border-color: #a74747;
    background: rgba(180, 50, 50, .1);
  }

  .my-project-actions button:disabled {
    cursor: not-allowed;
    opacity: .6;
  }

  .my-projects-loading,
  .my-projects-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 35px;
    border: 1px dashed #333;
    border-radius: 15px;
    background: #111;
    text-align: center;
  }

  .my-projects-loading {
    gap: 14px;
    color: #999;
  }

  .my-projects-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #292929;
    border-top-color: #ff6b00;
    border-radius: 50%;
    animation: my-projects-spin .8s linear infinite;
  }

  @keyframes my-projects-spin {
    to { transform: rotate(360deg); }
  }

  .my-projects-empty-icon {
    display: grid;
    place-items: center;
    width: 60px;
    height: 60px;
    margin-bottom: 17px;
    border-radius: 18px;
    background: rgba(255, 107, 0, .1);
    color: #ff8739;
    font-size: 30px;
  }

  .my-projects-empty h2 {
    margin: 0 0 9px;
    color: #fff;
    font-size: 19px;
  }

  .my-projects-empty p {
    max-width: 430px;
    margin: 0 0 20px;
    color: #999;
    font-size: 13px;
    line-height: 1.7;
  }

  .my-projects-primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 42px;
    padding: 0 17px;
    border: 0;
    border-radius: 8px;
    background: #ff6b00;
    color: #111;
    cursor: pointer;
    font-size: 12px;
    font-weight: 800;
  }

  .my-projects-primary-button:hover {
    background: #ff812b;
  }

  .my-project-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow-y: auto;
    padding: 24px;
    background: rgba(0, 0, 0, .78);
    backdrop-filter: blur(5px);
  }

  .my-project-modal {
    width: min(540px, 100%);
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    border: 1px solid #333;
    border-radius: 16px;
    background: #121212;
    box-shadow: 0 25px 80px rgba(0, 0, 0, .55);
  }

  .my-project-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    padding: 25px 27px 20px;
    border-bottom: 1px solid #292929;
    background: radial-gradient(circle at 90% 0%, rgba(255, 107, 0, .12), transparent 45%);
  }

  .my-project-modal-header h2 {
    margin: 0;
    color: #fff;
    font-size: 21px;
  }

  .my-project-modal-header p {
    margin: 7px 0 0;
    color: #888;
    font-size: 12px;
  }

  .my-project-modal-close {
    display: grid;
    place-items: center;
    flex: 0 0 32px;
    width: 32px;
    height: 32px;
    border: 1px solid #333;
    border-radius: 8px;
    background: #1b1b1b;
    color: #aaa;
    cursor: pointer;
    font-size: 22px;
    line-height: 1;
  }

  .my-project-modal-close:hover {
    background: #292929;
    color: #fff;
  }

  .my-project-modal-body {
    display: flex;
    flex-direction: column;
    gap: 17px;
    padding: 24px 27px;
  }

  .my-project-form-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .my-project-form-field label {
    color: #d2d2d2;
    font-size: 12px;
    font-weight: 700;
  }

  .my-project-form-field input,
  .my-project-form-field textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 13px;
    border: 1px solid #303030;
    border-radius: 8px;
    outline: none;
    background: #0b0b0b;
    color: #f5f5f5;
    font: inherit;
    font-size: 13px;
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .my-project-form-field input {
    min-height: 43px;
  }

  .my-project-form-field textarea {
    resize: vertical;
    line-height: 1.6;
  }

  .my-project-form-field input:focus,
  .my-project-form-field textarea:focus {
    border-color: #ff6b00;
    box-shadow: 0 0 0 3px rgba(255, 107, 0, .1);
  }

  .my-project-form-field input::placeholder,
  .my-project-form-field textarea::placeholder {
    color: #626262;
  }

  .my-project-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .my-project-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 17px 27px 24px;
    border-top: 1px solid #292929;
  }

  .my-project-cancel-button,
  .my-project-save-button {
    min-height: 42px;
    padding: 0 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 800;
    transition: background .2s ease;
  }

  .my-project-cancel-button {
    border: 1px solid #383838;
    background: #1b1b1b;
    color: #bbb;
  }

  .my-project-cancel-button:hover:not(:disabled) {
    background: #292929;
  }

  .my-project-save-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    border: 0;
    background: #ff6b00;
    color: #111;
  }

  .my-project-save-button:hover:not(:disabled) {
    background: #ff812b;
  }

  .my-project-cancel-button:disabled,
  .my-project-save-button:disabled,
  .my-project-modal-close:disabled {
    cursor: not-allowed;
    opacity: .6;
  }

  @media (max-width: 760px) {
    .my-project-card {
      align-items: stretch;
      flex-direction: column;
    }

    .my-project-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      flex: auto;
    }

    .my-project-proposals-button {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 540px) {
    .my-projects-page {
      padding: 25px 14px 50px;
    }

    .my-projects-header {
      align-items: flex-start;
      padding: 22px;
    }

    .my-projects-count {
      flex-basis: 80px;
      min-height: 75px;
    }

    .my-projects-count span {
      font-size: 25px;
    }

    .my-projects-count small {
      max-width: 75px;
      font-size: 9px;
    }

    .my-project-card {
      padding: 19px;
    }

    .my-project-details {
      gap: 15px;
    }

    .my-project-modal-overlay {
      align-items: flex-start;
      padding: 12px;
    }

    .my-project-modal {
      max-height: calc(100vh - 24px);
    }

    .my-project-modal-header,
    .my-project-modal-body {
      padding-left: 19px;
      padding-right: 19px;
    }

    .my-project-modal-actions {
      padding: 15px 19px 19px;
    }

    .my-project-form-grid {
      grid-template-columns: 1fr;
    }
  }
`;