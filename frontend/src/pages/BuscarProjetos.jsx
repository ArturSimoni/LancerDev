import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function BuscarProjetos() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coverText, setCoverText] = useState('');
  const [sending, setSending] = useState(false);
  const [milestones, setMilestones] = useState([
    { title: '', description: '', amount: '' }
  ]);

  const usuarioLogadoId = Number(localStorage.getItem('userId') || 0);

  useEffect(() => {
    setLoading(true);

    if (id) {
      api.get(`/projects/${id}`)
        .then(response => setProject(response.data))
        .catch(error => {
          console.error(error);
          setProject(null);
        })
        .finally(() => setLoading(false));
    } else {
      api.get('/projects/vitrine')
        .then(response => setProjects(response.data))
        .catch(error => {
          console.error(error);
          setProjects([]);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    if (project && Number(project.clientId) === usuarioLogadoId) {
      navigate(`/projetos/${id}/propostas`, { replace: true });
    }
  }, [project, id, navigate, usuarioLogadoId]);

  const handleAddMilestone = () => {
    setMilestones(current => [
      ...current,
      { title: '', description: '', amount: '' }
    ]);
  };

  const handleRemoveMilestone = index => {
    if (milestones.length === 1) return;

    setMilestones(current => current.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index, field, value) => {
    setMilestones(current =>
      current.map((milestone, i) =>
        i === index ? { ...milestone, [field]: value } : milestone
      )
    );
  };

  const totalAmount = milestones.reduce(
    (sum, milestone) => sum + Number(milestone.amount || 0),
    0
  );

  const formatCurrency = value =>
    Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

  const handleSubmitProposal = async event => {
    event.preventDefault();

    const validMilestones = milestones.every(
      milestone =>
        milestone.title.trim() &&
        Number(milestone.amount) > 0
    );

    if (!coverText.trim()) {
      alert('Preencha sua mensagem de apresentação.');
      return;
    }

    if (!validMilestones || totalAmount <= 0) {
      alert('Preencha o título e um valor válido para cada etapa.');
      return;
    }

    try {
      setSending(true);

      await api.post('/propostas', {
        projectId: id,
        coverText,
        totalAmount,
        milestones
      });

      alert('Proposta enviada com sucesso!');
      navigate('/propostas');
    } catch (error) {
      console.error(error);
      alert('Falha ao enviar proposta. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="buscar-loading">
        <div className="buscar-spinner" />
        <p>Carregando projetos...</p>
        <style>{styles}</style>
      </div>
    );
  }

  if (!id) {
    return (
      <main className="buscar-page">
        <style>{styles}</style>

        <section className="buscar-header">
          <div>
            <span className="buscar-eyebrow">OPORTUNIDADES</span>
            <h1>Projetos disponíveis</h1>
            <p>
              Encontre projetos, apresente suas habilidades e transforme
              oportunidades em novas experiências.
            </p>
          </div>

          <div className="buscar-header-icon">
            <span>⌕</span>
          </div>
        </section>

        <div className="buscar-results-header">
          <div>
            <h2>Explore os projetos</h2>
            <span>
              {projects.length} {projects.length === 1 ? 'projeto encontrado' : 'projetos encontrados'}
            </span>
          </div>
        </div>

        {projects.length === 0 ? (
          <section className="buscar-empty">
            <div className="buscar-empty-icon">⌕</div>
            <h3>Nenhum projeto disponível</h3>
            <p>
              Ainda não há oportunidades publicadas. Volte em breve para
              conferir novos projetos.
            </p>
          </section>
        ) : (
          <div className="buscar-project-grid">
            {projects.map(projectItem => (
              <article className="buscar-project-card" key={projectItem.id}>
                <div className="buscar-card-top">
                  <span className="buscar-project-tag">Projeto</span>
                  <span className="buscar-project-id">#{projectItem.id}</span>
                </div>

                <h3>{projectItem.title}</h3>

                <p className="buscar-project-description">
                  {projectItem.description || 'O cliente ainda não adicionou uma descrição.'}
                </p>

                <div className="buscar-card-divider" />

                <div className="buscar-card-bottom">
                  <div>
                    <span className="buscar-budget-label">Orçamento disponível</span>
                    <strong>{formatCurrency(projectItem.budget)}</strong>
                  </div>

                  <Link
                    to={`/projeto/${projectItem.id}`}
                    className="buscar-view-button"
                  >
                    Ver detalhes <span>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    );
  }

  if (!project) {
    return (
      <main className="buscar-page">
        <style>{styles}</style>
        <section className="buscar-empty">
          <div className="buscar-empty-icon">!</div>
          <h3>Projeto não encontrado</h3>
          <p>Este projeto pode ter sido removido ou não está mais disponível.</p>
          <Link to="/buscar-projetos" className="buscar-view-button">
            Voltar aos projetos
          </Link>
        </section>
      </main>
    );
  }

  if (Number(project.clientId) === usuarioLogadoId) {
    return null;
  }

  return (
    <main className="buscar-page">
      <style>{styles}</style>

      <div className="proposal-layout">
        <section className="proposal-main">
          <div className="proposal-breadcrumb">
            <Link to="/buscar-projetos">Projetos disponíveis</Link>
            <span>/</span>
            <span>Enviar proposta</span>
          </div>

          <header className="proposal-header">
            <span className="buscar-eyebrow">NOVA OPORTUNIDADE</span>
            <h1>Monte sua proposta</h1>
            <p>
              Apresente sua solução e organize o desenvolvimento em etapas
              claras para o cliente.
            </p>
          </header>

          <form onSubmit={handleSubmitProposal}>
            <section className="proposal-section">
              <div className="proposal-section-heading">
                <div className="proposal-step-number">01</div>
                <div>
                  <h2>Sua apresentação</h2>
                  <p>Conte por que você é a pessoa certa para este projeto.</p>
                </div>
              </div>

              <label className="proposal-label" htmlFor="coverText">
                Mensagem de apresentação
              </label>
              <textarea
                id="coverText"
                className="proposal-textarea"
                placeholder="Olá! Analisei os detalhes do projeto e acredito que posso contribuir com..."
                value={coverText}
                onChange={event => setCoverText(event.target.value)}
                rows={6}
                required
              />
              <div className="proposal-character-count">
                {coverText.length} caracteres
              </div>
            </section>

            <section className="proposal-section">
              <div className="proposal-section-heading">
                <div className="proposal-step-number">02</div>
                <div>
                  <h2>Etapas do desenvolvimento</h2>
                  <p>
                    Divida o trabalho em entregas menores. Cada etapa poderá
                    ser acompanhada pelo cliente no Kanban.
                  </p>
                </div>
              </div>

              <div className="milestone-list">
                {milestones.map((milestone, index) => (
                  <article className="milestone-card" key={index}>
                    <div className="milestone-card-header">
                      <div className="milestone-card-title">
                        <span className="milestone-number">{String(index + 1).padStart(2, '0')}</span>
                        <strong>Etapa {index + 1}</strong>
                      </div>

                      {milestones.length > 1 && (
                        <button
                          type="button"
                          className="milestone-remove"
                          onClick={() => handleRemoveMilestone(index)}
                          aria-label={`Remover etapa ${index + 1}`}
                        >
                          Remover
                        </button>
                      )}
                    </div>

                    <div className="milestone-fields">
                      <div className="proposal-field">
                        <label className="proposal-label" htmlFor={`milestone-title-${index}`}>
                          Título da etapa
                        </label>
                        <input
                          id={`milestone-title-${index}`}
                          className="proposal-input"
                          type="text"
                          placeholder="Ex.: Desenvolvimento da interface"
                          value={milestone.title}
                          onChange={event =>
                            handleMilestoneChange(index, 'title', event.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="proposal-field">
                        <label className="proposal-label" htmlFor={`milestone-description-${index}`}>
                          Descrição
                        </label>
                        <textarea
                          id={`milestone-description-${index}`}
                          className="proposal-input proposal-small-textarea"
                          placeholder="Descreva o que será entregue nesta etapa..."
                          value={milestone.description}
                          onChange={event =>
                            handleMilestoneChange(index, 'description', event.target.value)
                          }
                          rows={3}
                        />
                      </div>

                      <div className="proposal-field">
                        <label className="proposal-label" htmlFor={`milestone-amount-${index}`}>
                          Valor da etapa
                        </label>
                        <div className="proposal-money-input">
                          <span>R$</span>
                          <input
                            id={`milestone-amount-${index}`}
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="0,00"
                            value={milestone.amount}
                            onChange={event =>
                              handleMilestoneChange(index, 'amount', event.target.value)
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <button
                type="button"
                className="milestone-add-button"
                onClick={handleAddMilestone}
              >
                <span>+</span> Adicionar outra etapa
              </button>
            </section>

            <section className="proposal-total-card">
              <div>
                <span className="proposal-total-label">Valor total da proposta</span>
                <strong>{formatCurrency(totalAmount)}</strong>
                <p>O valor será distribuído entre as etapas cadastradas.</p>
              </div>

              <div className="proposal-total-icon">R$</div>
            </section>

            <div className="proposal-actions">
              <Link to="/buscar-projetos" className="proposal-cancel-button">
                Cancelar
              </Link>

              <button
                type="submit"
                className="proposal-submit-button"
                disabled={sending}
              >
                {sending ? 'Enviando...' : 'Enviar proposta'}
                {!sending && <span>→</span>}
              </button>
            </div>
          </form>
        </section>

        <aside className="proposal-sidebar">
          <div className="proposal-tip-card">
            <div className="proposal-tip-icon">✦</div>
            <h3>Dica para sua proposta</h3>
            <p>
              Uma proposta bem estruturada ajuda o cliente a entender seu
              processo de trabalho e acompanhar cada entrega.
            </p>
          </div>

          <div className="proposal-flow-card">
            <h3>Como funciona</h3>

            <div className="proposal-flow-item">
              <span>01</span>
              <div>
                <strong>Envie sua proposta</strong>
                <p>Apresente sua solução e seus valores.</p>
              </div>
            </div>

            <div className="proposal-flow-item">
              <span>02</span>
              <div>
                <strong>Aguarde a aprovação</strong>
                <p>O cliente poderá analisar sua proposta.</p>
              </div>
            </div>

            <div className="proposal-flow-item">
              <span>03</span>
              <div>
                <strong>Execute por etapas</strong>
                <p>Acompanhe o progresso das entregas.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

const styles = `
  .buscar-page {
    width: min(1180px, calc(100% - 40px));
    margin: 0 auto;
    padding: 48px 0 70px;
    color: #f5f5f5;
  }

  .buscar-loading {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    color: #aaa;
    background: #090909;
  }

  .buscar-spinner {
    width: 38px;
    height: 38px;
    border: 3px solid #292929;
    border-top-color: #ff6b00;
    border-radius: 50%;
    animation: buscar-spin .8s linear infinite;
  }

  @keyframes buscar-spin {
    to { transform: rotate(360deg); }
  }

  .buscar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 34px;
    margin-bottom: 38px;
    border: 1px solid #282828;
    border-radius: 18px;
    background: radial-gradient(circle at 90% 20%, rgba(255, 107, 0, .15), transparent 35%), #111;
  }

  .buscar-eyebrow {
    display: inline-block;
    margin-bottom: 12px;
    color: #ff7a1a;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2px;
  }

  .buscar-header h1,
  .proposal-header h1 {
    margin: 0;
    color: #fff;
    font-size: clamp(28px, 4vw, 40px);
    letter-spacing: -1.2px;
  }

  .buscar-header p,
  .proposal-header p {
    max-width: 650px;
    margin: 12px 0 0;
    color: #a5a5a5;
    font-size: 15px;
    line-height: 1.7;
  }

  .buscar-header-icon {
    display: grid;
    place-items: center;
    flex: 0 0 76px;
    width: 76px;
    height: 76px;
    border: 1px solid rgba(255, 107, 0, .35);
    border-radius: 20px;
    background: rgba(255, 107, 0, .1);
    color: #ff7a1a;
    font-size: 45px;
  }

  .buscar-results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }

  .buscar-results-header h2 {
    margin: 0 0 5px;
    color: #fff;
    font-size: 20px;
  }

  .buscar-results-header span {
    color: #858585;
    font-size: 13px;
  }

  .buscar-project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 18px;
  }

  .buscar-project-card {
    display: flex;
    flex-direction: column;
    min-height: 265px;
    padding: 24px;
    border: 1px solid #292929;
    border-radius: 15px;
    background: linear-gradient(145deg, #151515, #101010);
    transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
  }

  .buscar-project-card:hover {
    transform: translateY(-4px);
    border-color: rgba(255, 107, 0, .55);
    box-shadow: 0 14px 35px rgba(0, 0, 0, .22);
  }

  .buscar-card-top,
  .buscar-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .buscar-project-tag {
    padding: 6px 10px;
    border-radius: 20px;
    background: rgba(255, 107, 0, .12);
    color: #ff8a3d;
    font-size: 11px;
    font-weight: 700;
  }

  .buscar-project-id {
    color: #666;
    font-size: 12px;
  }

  .buscar-project-card h3 {
    margin: 20px 0 9px;
    color: #fff;
    font-size: 19px;
    line-height: 1.4;
  }

  .buscar-project-description {
    display: -webkit-box;
    overflow: hidden;
    margin: 0;
    color: #a0a0a0;
    font-size: 13px;
    line-height: 1.7;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .buscar-card-divider {
    height: 1px;
    margin: auto 0 18px;
    padding-top: 18px;
    border-bottom: 1px solid #292929;
  }

  .buscar-budget-label,
  .proposal-total-label {
    display: block;
    margin-bottom: 6px;
    color: #888;
    font-size: 11px;
  }

  .buscar-card-bottom strong {
    color: #00c985;
    font-size: 17px;
  }

  .buscar-view-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 11px 14px;
    border: 1px solid #ff6b00;
    border-radius: 8px;
    background: #ff6b00;
    color: #111;
    font-size: 12px;
    font-weight: 800;
    text-decoration: none;
    white-space: nowrap;
    transition: background .2s ease, transform .2s ease;
  }

  .buscar-view-button:hover {
    transform: translateY(-1px);
    background: #ff812b;
  }

  .buscar-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 35px;
    border: 1px dashed #333;
    border-radius: 16px;
    background: #111;
    text-align: center;
  }

  .buscar-empty-icon {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    margin-bottom: 18px;
    border-radius: 18px;
    background: rgba(255, 107, 0, .1);
    color: #ff7a1a;
    font-size: 30px;
  }

  .buscar-empty h3 {
    margin: 0 0 8px;
    color: #fff;
    font-size: 19px;
  }

  .buscar-empty p {
    max-width: 420px;
    margin: 0 0 20px;
    color: #999;
    font-size: 13px;
    line-height: 1.7;
  }

  .proposal-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 285px;
    align-items: start;
    gap: 28px;
  }

  .proposal-main {
    min-width: 0;
  }

  .proposal-breadcrumb {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 28px;
    color: #777;
    font-size: 12px;
  }

  .proposal-breadcrumb a {
    color: #ff8739;
    text-decoration: none;
  }

  .proposal-breadcrumb a:hover {
    text-decoration: underline;
  }

  .proposal-header {
    margin-bottom: 30px;
  }

  .proposal-section {
    margin-bottom: 22px;
    padding: 27px;
    border: 1px solid #292929;
    border-radius: 15px;
    background: #111;
  }

  .proposal-section-heading {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 25px;
  }

  .proposal-step-number {
    display: grid;
    place-items: center;
    flex: 0 0 39px;
    width: 39px;
    height: 39px;
    border: 1px solid rgba(255, 107, 0, .35);
    border-radius: 11px;
    background: rgba(255, 107, 0, .1);
    color: #ff8739;
    font-size: 12px;
    font-weight: 800;
  }

  .proposal-section-heading h2 {
    margin: 1px 0 6px;
    color: #fff;
    font-size: 18px;
  }

  .proposal-section-heading p {
    margin: 0;
    color: #888;
    font-size: 12px;
    line-height: 1.6;
  }

  .proposal-label {
    display: block;
    margin-bottom: 9px;
    color: #d2d2d2;
    font-size: 12px;
    font-weight: 700;
  }

  .proposal-textarea,
  .proposal-input,
  .proposal-money-input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #303030;
    border-radius: 9px;
    background: #0b0b0b;
    color: #f5f5f5;
    font: inherit;
    font-size: 13px;
    outline: none;
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .proposal-textarea,
  .proposal-input {
    padding: 13px 14px;
  }

  .proposal-textarea {
    min-height: 145px;
    resize: vertical;
    line-height: 1.6;
  }

  .proposal-textarea::placeholder,
  .proposal-input::placeholder,
  .proposal-money-input input::placeholder {
    color: #626262;
  }

  .proposal-textarea:focus,
  .proposal-input:focus,
  .proposal-money-input:focus-within {
    border-color: #ff6b00;
    box-shadow: 0 0 0 3px rgba(255, 107, 0, .1);
  }

  .proposal-character-count {
    margin-top: 7px;
    color: #686868;
    font-size: 11px;
    text-align: right;
  }

  .milestone-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .milestone-card {
    padding: 19px;
    border: 1px solid #2b2b2b;
    border-radius: 12px;
    background: #0d0d0d;
  }

  .milestone-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
  }

  .milestone-card-title {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #eee;
    font-size: 13px;
  }

  .milestone-number {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: #202020;
    color: #ff8739;
    font-size: 10px;
    font-weight: 800;
  }

  .milestone-remove {
    padding: 6px 9px;
    border: 1px solid #4a2929;
    border-radius: 6px;
    background: transparent;
    color: #e17b7b;
    cursor: pointer;
    font-size: 11px;
  }

  .milestone-remove:hover {
    border-color: #a74747;
    background: rgba(180, 50, 50, .1);
  }

  .milestone-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .proposal-field:first-child {
    grid-column: 1 / -1;
  }

  .proposal-small-textarea {
    min-height: 76px;
    resize: vertical;
    line-height: 1.5;
  }

  .proposal-money-input {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 0 12px;
  }

  .proposal-money-input span {
    color: #888;
    font-size: 12px;
    font-weight: 700;
  }

  .proposal-money-input input {
    width: 100%;
    min-width: 0;
    padding: 11px 8px;
    border: 0;
    outline: 0;
    background: transparent;
    color: #fff;
    font: inherit;
    font-size: 13px;
  }

  .milestone-add-button {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    margin-top: 17px;
    padding: 10px 13px;
    border: 1px dashed rgba(255, 107, 0, .55);
    border-radius: 8px;
    background: rgba(255, 107, 0, .05);
    color: #ff8739;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    transition: background .2s ease;
  }

  .milestone-add-button:hover {
    background: rgba(255, 107, 0, .12);
  }

  .milestone-add-button span {
    font-size: 19px;
    line-height: 12px;
  }

  .proposal-total-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 20px;
    padding: 23px 27px;
    border: 1px solid rgba(0, 201, 133, .25);
    border-radius: 13px;
    background: linear-gradient(110deg, rgba(0, 201, 133, .09), #111 65%);
  }

  .proposal-total-card strong {
    display: block;
    color: #00d492;
    font-size: 28px;
    letter-spacing: -.5px;
  }

  .proposal-total-card p {
    margin: 7px 0 0;
    color: #888;
    font-size: 11px;
  }

  .proposal-total-icon {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border: 1px solid rgba(0, 201, 133, .25);
    border-radius: 14px;
    color: #00d492;
    font-size: 15px;
    font-weight: 800;
  }

  .proposal-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
  }

  .proposal-cancel-button,
  .proposal-submit-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 45px;
    padding: 0 19px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
    transition: background .2s ease, transform .2s ease;
  }

  .proposal-cancel-button {
    border: 1px solid #383838;
    background: #151515;
    color: #bbb;
  }

  .proposal-cancel-button:hover {
    background: #202020;
  }

  .proposal-submit-button {
    border: 0;
    background: #ff6b00;
    color: #111;
  }

  .proposal-submit-button:hover:not(:disabled) {
    transform: translateY(-1px);
    background: #ff812b;
  }

  .proposal-submit-button:disabled {
    cursor: not-allowed;
    opacity: .65;
  }

  .proposal-submit-button span {
    font-size: 17px;
  }

  .proposal-sidebar {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding-top: 76px;
  }

  .proposal-tip-card,
  .proposal-flow-card {
    padding: 21px;
    border: 1px solid #292929;
    border-radius: 13px;
    background: #111;
  }

  .proposal-tip-card {
    background: radial-gradient(circle at 100% 0%, rgba(255, 107, 0, .13), transparent 50%), #111;
  }

  .proposal-tip-icon {
    display: grid;
    place-items: center;
    width: 37px;
    height: 37px;
    margin-bottom: 15px;
    border-radius: 11px;
    background: rgba(255, 107, 0, .12);
    color: #ff8739;
    font-size: 20px;
  }

  .proposal-tip-card h3,
  .proposal-flow-card h3 {
    margin: 0 0 10px;
    color: #fff;
    font-size: 15px;
  }

  .proposal-tip-card p {
    margin: 0;
    color: #999;
    font-size: 12px;
    line-height: 1.7;
  }

  .proposal-flow-card h3 {
    margin-bottom: 20px;
  }

  .proposal-flow-item {
    display: flex;
    gap: 11px;
    padding-bottom: 18px;
  }

  .proposal-flow-item:last-child {
    padding-bottom: 0;
  }

  .proposal-flow-item > span {
    display: grid;
    place-items: center;
    flex: 0 0 27px;
    width: 27px;
    height: 27px;
    border-radius: 8px;
    background: #222;
    color: #ff8739;
    font-size: 10px;
    font-weight: 800;
  }

  .proposal-flow-item strong {
    color: #ddd;
    font-size: 11px;
  }

  .proposal-flow-item p {
    margin: 5px 0 0;
    color: #858585;
    font-size: 11px;
    line-height: 1.5;
  }

  @media (max-width: 900px) {
    .proposal-layout {
      grid-template-columns: 1fr;
    }

    .proposal-sidebar {
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding-top: 0;
    }
  }

  @media (max-width: 620px) {
    .buscar-page {
      width: min(100% - 28px, 1180px);
      padding-top: 25px;
    }

    .buscar-header {
      padding: 24px;
    }

    .buscar-header-icon {
      display: none;
    }

    .buscar-project-card {
      padding: 19px;
    }

    .buscar-card-bottom {
      align-items: flex-start;
      flex-direction: column;
    }

    .buscar-view-button {
      width: 100%;
      box-sizing: border-box;
    }

    .proposal-section {
      padding: 19px;
    }

    .milestone-fields {
      grid-template-columns: 1fr;
    }

    .proposal-field:first-child {
      grid-column: auto;
    }

    .proposal-total-card {
      padding: 19px;
    }

    .proposal-total-card strong {
      font-size: 23px;
    }

    .proposal-sidebar {
      grid-template-columns: 1fr;
    }

    .proposal-actions {
      flex-direction: column-reverse;
    }

    .proposal-cancel-button,
    .proposal-submit-button {
      width: 100%;
      box-sizing: border-box;
    }
  }
`;