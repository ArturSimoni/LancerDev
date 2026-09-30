import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const howItWorks = [
  {
    number: '01',
    icon: '▤',
    title: 'Cliente publica o projeto',
    desc: 'Descreva o escopo, defina o orçamento e organize as entregas esperadas.'
  },
  {
    number: '02',
    icon: '⌁',
    title: 'Freelancer envia proposta',
    desc: 'Profissionais apresentam soluções com valores e etapas de desenvolvimento.'
  },
  {
    number: '03',
    icon: '◇',
    title: 'Pagamento em garantia',
    desc: 'O pagamento é realizado antes da execução e segue as condições da plataforma.'
  },
  {
    number: '04',
    icon: '✓',
    title: 'Entrega e avaliação',
    desc: 'Acompanhe as entregas, homologue as etapas e avalie o profissional.'
  }
];

const stats = [
  { value: 'Por etapas', label: 'Projetos organizados' },
  { value: 'Para devs', label: 'Especializada em tecnologia' },
  { value: 'Escrow', label: 'Pagamento em garantia' }
];

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem('@LancerDev:token');

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await api.get('/projects/vitrine');
        setProjects(response.data);
      } catch (error) {
        console.error('Erro ao buscar projetos da vitrine:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function openProject(projectId) {
    navigate(isLoggedIn ? `/projeto/${projectId}` : '/login');
  }

  return (
    <main className="home-page">
      <style>{styles}</style>

      <section className="home-hero">
        <div className="home-hero-glow" />

        <div className="home-hero-content">
          <div className="home-eyebrow">
            <span className="home-eyebrow-dot" />
            Plataforma de freelance para desenvolvedores
          </div>

          <h1>
            Seu próximo projeto
            <br />
            começa com uma
            <br />
            <span>boa conexão.</span>
          </h1>

          <p className="home-hero-description">
            A LancerDev conecta clientes e profissionais de tecnologia em um
            ambiente pensado para organizar propostas, acompanhar entregas e
            oferecer mais transparência durante o desenvolvimento.
          </p>

          <div className="home-hero-actions">
            {isLoggedIn ? (
              <Link to="/dashboard" className="home-button home-button-primary">
                Ir para o dashboard <span>→</span>
              </Link>
            ) : (
              <>
                <Link to="/cadastro" className="home-button home-button-primary">
                  Criar conta grátis <span>→</span>
                </Link>
                <Link to="/login" className="home-button home-button-secondary">
                  Já tenho conta
                </Link>
              </>
            )}
          </div>

          <div className="home-stats">
            {stats.map((stat, index) => (
              <div className="home-stat" key={stat.label}>
                {index > 0 && <span className="home-stat-divider" />}
                <div>
                  <strong>{stat.value}</strong>
                  <small>{stat.label}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="home-hero-visual" aria-hidden="true">
          <div className="home-visual-orbit home-orbit-one" />
          <div className="home-visual-orbit home-orbit-two" />

          <div className="home-visual-card">
            <div className="home-visual-card-header">
              <div className="home-visual-dots">
                <span />
                <span />
                <span />
              </div>
              <span>lancerdev.app</span>
            </div>

            <div className="home-visual-project">
              <div className="home-visual-project-icon">{"</>"}</div>
              <div>
                <strong>Projeto em andamento</strong>
                <small>Desenvolvimento web</small>
              </div>
              <span className="home-visual-status">Ativo</span>
            </div>

            <div className="home-visual-progress">
              <div className="home-visual-progress-heading">
                <span>Progresso do projeto</span>
                <strong>75%</strong>
              </div>
              <div className="home-progress-track">
                <span />
              </div>
            </div>

            <div className="home-visual-milestone">
              <div className="home-milestone-check">✓</div>
              <div>
                <strong>Interface desenvolvida</strong>
                <small>Etapa concluída</small>
              </div>
              <span className="home-milestone-done">Concluída</span>
            </div>

            <div className="home-visual-milestone home-milestone-current">
              <div className="home-milestone-number">02</div>
              <div>
                <strong>Integração com API</strong>
                <small>Em desenvolvimento</small>
              </div>
              <span className="home-milestone-active">Em andamento</span>
            </div>
          </div>

          <div className="home-floating-badge">
            <span>✓</span>
            Entregas organizadas
          </div>
        </div>
      </section>

      <section className="home-how-section">
        <div className="home-section-heading">
          <span className="home-section-eyebrow">SIMPLES E ORGANIZADO</span>
          <h2>Como funciona a <span>LancerDev?</span></h2>
          <p>
            Do primeiro contato à entrega final, cada etapa tem seu espaço
            dentro da plataforma.
          </p>
        </div>

        <div className="home-steps-grid">
          {howItWorks.map(step => (
            <article className="home-step-card" key={step.number}>
              <div className="home-step-top">
                <span className="home-step-number">{step.number}</span>
                <span className="home-step-icon">{step.icon}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-projects-section">
        <div className="home-section-heading home-projects-heading">
          <div>
            <span className="home-section-eyebrow">OPORTUNIDADES</span>
            <h2>Projetos disponíveis</h2>
            <p>
              Confira oportunidades publicadas por clientes na plataforma.
            </p>
          </div>

          <Link to="/buscar-projetos" className="home-see-all">
            Explorar projetos <span>→</span>
          </Link>
        </div>

        {loading ? (
          <div className="home-state-card">
            <div className="home-spinner" />
            <p>Carregando oportunidades...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="home-state-card">
            <div className="home-state-icon">⌕</div>
            <h3>Nenhum projeto aberto no momento</h3>
            <p>
              Novas oportunidades poderão aparecer aqui em breve.
            </p>
            {!isLoggedIn && (
              <Link to="/cadastro" className="home-button home-button-primary">
                Criar minha conta <span>→</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="home-project-list">
            {projects.map(project => (
              <article className="home-project-card" key={project.id}>
                <div className="home-project-main">
                  <div className="home-project-meta">
                    <span className="home-project-status">
                      <span />
                      Aberto para propostas
                    </span>
                    <span className="home-project-id">Projeto #{project.id}</span>
                  </div>

                  <h3>{project.title}</h3>

                  <p className="home-project-description">
                    {(project.description || 'O cliente ainda não adicionou uma descrição.').length > 180
                      ? `${project.description.substring(0, 180)}...`
                      : project.description || 'O cliente ainda não adicionou uma descrição.'}
                  </p>

                  <span className="home-project-client">
                    Publicado por {project.client?.name || 'Cliente'}
                  </span>
                </div>

                <div className="home-project-side">
                  <div className="home-project-budget">
                    <small>Orçamento informado</small>
                    <strong>{formatCurrency(project.budget)}</strong>
                  </div>

                  <button
                    type="button"
                    className="home-project-button"
                    onClick={() => openProject(project.id)}
                  >
                    Ver detalhes <span>→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="home-cta">
        <div className="home-cta-decoration" />
        <div className="home-cta-content">
          <span className="home-section-eyebrow">O PRÓXIMO PASSO É SEU</span>
          <h2>
            Transforme ideias em
            <br />
            <span>projetos reais.</span>
          </h2>
          <p>
            Faça parte de um ambiente dedicado ao desenvolvimento de software,
            com propostas estruturadas e entregas acompanhadas.
          </p>

          <div className="home-cta-actions">
            {isLoggedIn ? (
              <Link to="/dashboard" className="home-button home-button-primary">
                Acessar meu dashboard <span>→</span>
              </Link>
            ) : (
              <>
                <Link to="/cadastro" className="home-button home-button-primary">
                  Começar agora <span>→</span>
                </Link>
                <Link to="/login" className="home-button home-button-secondary">
                  Entrar na plataforma
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="home-cta-mark" aria-hidden="true">{"</>"}</div>
      </section>
    </main>
  );
}

const styles = `
  .home-page {
    width: min(1200px, calc(100% - 40px));
    margin: 0 auto;
    padding: 0 0 70px;
    color: #f5f5f5;
  }

  .home-hero {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(320px, .9fr);
    align-items: center;
    gap: 35px;
    min-height: 570px;
    padding: 75px 30px 55px;
    border-bottom: 1px solid #242424;
    overflow: hidden;
  }

  .home-hero-glow {
    position: absolute;
    top: -170px;
    right: 0;
    width: 620px;
    height: 620px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 107, 0, .12), transparent 68%);
    pointer-events: none;
  }

  .home-hero-content {
    position: relative;
    z-index: 1;
    max-width: 660px;
  }

  .home-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 22px;
    color: #ff8739;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.6px;
    text-transform: uppercase;
  }

  .home-eyebrow-dot,
  .home-project-status > span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #ff6b00;
    box-shadow: 0 0 12px rgba(255, 107, 0, .6);
  }

  .home-hero h1 {
    margin: 0;
    color: #fff;
    font-size: clamp(39px, 5.2vw, 64px);
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -2.8px;
  }

  .home-hero h1 span,
  .home-section-heading h2 span,
  .home-cta h2 span {
    color: #ff6b00;
  }

  .home-hero-description {
    max-width: 560px;
    margin: 23px 0 28px;
    color: #a0a0a0;
    font-size: 15px;
    line-height: 1.8;
  }

  .home-hero-actions,
  .home-cta-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .home-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 46px;
    padding: 0 20px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 800;
    text-decoration: none;
    transition: transform .2s ease, background .2s ease, border-color .2s ease;
  }

  .home-button:hover {
    transform: translateY(-2px);
  }

  .home-button-primary {
    border: 1px solid #ff6b00;
    background: #ff6b00;
    color: #111;
  }

  .home-button-primary:hover {
    background: #ff812b;
    border-color: #ff812b;
  }

  .home-button-secondary {
    border: 1px solid #444;
    background: rgba(255, 255, 255, .025);
    color: #ddd;
  }

  .home-button-secondary:hover {
    border-color: #ff6b00;
    color: #ff8739;
  }

  .home-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 25px;
    margin-top: 43px;
  }

  .home-stat {
    display: flex;
    align-items: center;
    gap: 22px;
  }

  .home-stat-divider {
    width: 1px;
    height: 34px;
    background: #333;
  }

  .home-stat strong,
  .home-stat small {
    display: block;
  }

  .home-stat strong {
    color: #f5f5f5;
    font-size: 15px;
    font-weight: 800;
  }

  .home-stat small {
    margin-top: 5px;
    color: #777;
    font-size: 10px;
  }

  .home-hero-visual {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 390px;
  }

  .home-visual-orbit {
    position: absolute;
    border: 1px solid rgba(255, 107, 0, .12);
    border-radius: 50%;
  }

  .home-orbit-one {
    width: 360px;
    height: 360px;
  }

  .home-orbit-two {
    width: 450px;
    height: 450px;
    border-style: dashed;
    border-color: rgba(255, 107, 0, .08);
  }

  .home-visual-card {
    position: relative;
    z-index: 1;
    width: min(390px, 100%);
    padding: 19px;
    border: 1px solid #343434;
    border-radius: 17px;
    background: linear-gradient(145deg, #1b1b1b, #101010);
    box-shadow: 0 25px 75px rgba(0, 0, 0, .48), 0 0 55px rgba(255, 107, 0, .07);
    transform: rotate(-2deg);
  }

  .home-visual-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 15px;
    border-bottom: 1px solid #2b2b2b;
    color: #777;
    font-size: 10px;
  }

  .home-visual-dots {
    display: flex;
    gap: 5px;
  }

  .home-visual-dots span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #444;
  }

  .home-visual-dots span:first-child {
    background: #ff6b00;
  }

  .home-visual-project {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 21px 0;
  }

  .home-visual-project-icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border: 1px solid rgba(255, 107, 0, .3);
    border-radius: 11px;
    background: rgba(255, 107, 0, .1);
    color: #ff8739;
    font-size: 13px;
    font-weight: 800;
  }

  .home-visual-project strong,
  .home-visual-project small {
    display: block;
  }

  .home-visual-project strong {
    color: #eee;
    font-size: 12px;
  }

  .home-visual-project small {
    margin-top: 5px;
    color: #777;
    font-size: 10px;
  }

  .home-visual-status {
    margin-left: auto;
    padding: 5px 8px;
    border-radius: 20px;
    background: rgba(0, 201, 133, .1);
    color: #00c985;
    font-size: 9px;
    font-weight: 700;
  }

  .home-visual-progress {
    padding: 15px;
    border: 1px solid #292929;
    border-radius: 10px;
    background: #111;
  }

  .home-visual-progress-heading {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    color: #999;
    font-size: 10px;
  }

  .home-visual-progress-heading strong {
    color: #ff8739;
  }

  .home-progress-track {
    height: 6px;
    overflow: hidden;
    border-radius: 10px;
    background: #2a2a2a;
  }

  .home-progress-track span {
    display: block;
    width: 75%;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #ff6b00, #ff9a52);
  }

  .home-visual-milestone {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 11px;
    padding: 12px;
    border: 1px solid #292929;
    border-radius: 9px;
    background: #141414;
  }

  .home-milestone-check,
  .home-milestone-number {
    display: grid;
    place-items: center;
    flex: 0 0 28px;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: rgba(0, 201, 133, .12);
    color: #00c985;
    font-size: 12px;
    font-weight: 800;
  }

  .home-milestone-number {
    background: rgba(255, 107, 0, .12);
    color: #ff8739;
    font-size: 10px;
  }

  .home-visual-milestone strong,
  .home-visual-milestone small {
    display: block;
  }

  .home-visual-milestone strong {
    color: #ddd;
    font-size: 10px;
  }

  .home-visual-milestone small {
    margin-top: 4px;
    color: #777;
    font-size: 9px;
  }

  .home-milestone-done,
  .home-milestone-active {
    margin-left: auto;
    color: #00c985;
    font-size: 8px;
    white-space: nowrap;
  }

  .home-milestone-active {
    color: #ff8739;
  }

  .home-floating-badge {
    position: absolute;
    right: -3px;
    bottom: 35px;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 12px 15px;
    border: 1px solid #343434;
    border-radius: 10px;
    background: #1a1a1a;
    box-shadow: 0 12px 35px rgba(0, 0, 0, .35);
    color: #ddd;
    font-size: 10px;
    font-weight: 700;
    transform: rotate(2deg);
  }

  .home-floating-badge span {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(0, 201, 133, .13);
    color: #00c985;
  }

  .home-how-section,
  .home-projects-section {
    padding: 70px 10px 0;
  }

  .home-section-heading {
    margin-bottom: 30px;
  }

  .home-section-eyebrow {
    display: inline-block;
    margin-bottom: 10px;
    color: #ff8739;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.8px;
  }

  .home-section-heading h2 {
    margin: 0;
    color: #fff;
    font-size: clamp(24px, 3vw, 32px);
    letter-spacing: -.8px;
  }

  .home-section-heading p {
    margin: 10px 0 0;
    color: #888;
    font-size: 13px;
    line-height: 1.7;
  }

  .home-steps-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 15px;
  }

  .home-step-card {
    position: relative;
    min-height: 190px;
    padding: 22px;
    overflow: hidden;
    border: 1px solid #292929;
    border-radius: 13px;
    background: linear-gradient(145deg, #151515, #101010);
    transition: transform .2s ease, border-color .2s ease;
  }

  .home-step-card:hover {
    transform: translateY(-4px);
    border-color: rgba(255, 107, 0, .45);
  }

  .home-step-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 25px;
  }

  .home-step-number {
    color: #666;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .home-step-icon {
    display: grid;
    place-items: center;
    width: 39px;
    height: 39px;
    border: 1px solid rgba(255, 107, 0, .25);
    border-radius: 11px;
    background: rgba(255, 107, 0, .09);
    color: #ff8739;
    font-size: 20px;
  }

  .home-step-card h3 {
    margin: 0 0 9px;
    color: #eee;
    font-size: 13px;
    line-height: 1.5;
  }

  .home-step-card p {
    margin: 0;
    color: #888;
    font-size: 11px;
    line-height: 1.7;
  }

  .home-projects-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
  }

  .home-see-all {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding-bottom: 4px;
    color: #ff8739;
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
  }

  .home-see-all:hover {
    color: #ffad78;
  }

  .home-project-list {
    display: flex;
    flex-direction: column;
    gap: 13px;
  }

  .home-project-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 25px;
    padding: 23px 25px;
    border: 1px solid #292929;
    border-radius: 13px;
    background: #111;
    transition: border-color .2s ease, transform .2s ease;
  }

  .home-project-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 107, 0, .4);
  }

  .home-project-main {
    flex: 1;
    min-width: 0;
  }

  .home-project-meta {
    display: flex;
    align-items: center;
    gap: 13px;
    margin-bottom: 12px;
  }

  .home-project-status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #00c985;
    font-size: 10px;
    font-weight: 700;
  }

  .home-project-status > span {
    width: 6px;
    height: 6px;
    background: #00c985;
    box-shadow: 0 0 9px rgba(0, 201, 133, .4);
  }

  .home-project-id {
    color: #666;
    font-size: 10px;
  }

  .home-project-card h3 {
    margin: 0 0 8px;
    color: #fff;
    font-size: 17px;
    line-height: 1.4;
  }

  .home-project-description {
    max-width: 690px;
    margin: 0;
    color: #999;
    font-size: 12px;
    line-height: 1.7;
  }

  .home-project-client {
    display: inline-block;
    margin-top: 12px;
    color: #777;
    font-size: 10px;
  }

  .home-project-side {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 15px;
    flex: 0 0 175px;
  }

  .home-project-budget {
    text-align: right;
  }

  .home-project-budget small,
  .home-project-budget strong {
    display: block;
  }

  .home-project-budget small {
    margin-bottom: 5px;
    color: #777;
    font-size: 10px;
  }

  .home-project-budget strong {
    color: #00c985;
    font-size: 18px;
  }

  .home-project-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    min-height: 39px;
    padding: 0 13px;
    border: 1px solid #ff6b00;
    border-radius: 7px;
    background: #ff6b00;
    color: #111;
    cursor: pointer;
    font-size: 11px;
    font-weight: 800;
    transition: background .2s ease, transform .2s ease;
  }

  .home-project-button:hover {
    transform: translateY(-1px);
    background: #ff812b;
  }

  .home-state-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 250px;
    padding: 30px;
    border: 1px dashed #333;
    border-radius: 13px;
    background: #111;
    text-align: center;
  }

  .home-state-card p {
    margin: 12px 0 0;
    color: #888;
    font-size: 12px;
  }

  .home-state-card h3 {
    margin: 0;
    color: #eee;
    font-size: 17px;
  }

  .home-state-card .home-button {
    margin-top: 20px;
  }

  .home-state-icon {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    margin-bottom: 17px;
    border-radius: 15px;
    background: rgba(255, 107, 0, .1);
    color: #ff8739;
    font-size: 27px;
  }

  .home-spinner {
    width: 34px;
    height: 34px;
    border: 3px solid #292929;
    border-top-color: #ff6b00;
    border-radius: 50%;
    animation: home-spin .8s linear infinite;
  }

  @keyframes home-spin {
    to { transform: rotate(360deg); }
  }

  .home-cta {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;
    margin: 75px 10px 0;
    padding: 45px 48px;
    overflow: hidden;
    border: 1px solid rgba(255, 107, 0, .28);
    border-radius: 17px;
    background: radial-gradient(circle at 90% 50%, rgba(255, 107, 0, .15), transparent 38%), #121212;
  }

  .home-cta-content {
    position: relative;
    z-index: 1;
    max-width: 650px;
  }

  .home-cta h2 {
    margin: 0;
    color: #fff;
    font-size: clamp(28px, 4vw, 40px);
    line-height: 1.15;
    letter-spacing: -1px;
  }

  .home-cta-content > p {
    max-width: 570px;
    margin: 15px 0 23px;
    color: #999;
    font-size: 13px;
    line-height: 1.7;
  }

  .home-cta-mark {
    position: relative;
    z-index: 1;
    color: rgba(255, 107, 0, .22);
    font-size: clamp(70px, 10vw, 130px);
    font-weight: 900;
    letter-spacing: -10px;
  }

  @media (max-width: 950px) {
    .home-hero {
      grid-template-columns: 1fr;
      padding-top: 65px;
    }

    .home-hero-content {
      max-width: 760px;
    }

    .home-hero-visual {
      min-height: 370px;
    }

    .home-steps-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .home-cta-mark {
      display: none;
    }
  }

  @media (max-width: 650px) {
    .home-page {
      width: calc(100% - 28px);
      padding-bottom: 45px;
    }

    .home-hero {
      min-height: auto;
      padding: 48px 5px 38px;
    }

    .home-hero h1 {
      font-size: clamp(36px, 10vw, 49px);
      letter-spacing: -1.8px;
    }

    .home-hero-description {
      font-size: 13px;
    }

    .home-stats {
      gap: 15px;
      margin-top: 32px;
    }

    .home-stat {
      gap: 12px;
    }

    .home-stat-divider {
      height: 29px;
    }

    .home-stat strong {
      font-size: 12px;
    }

    .home-stat small {
      max-width: 100px;
      font-size: 9px;
    }

    .home-hero-visual {
      min-height: 320px;
    }

    .home-orbit-one {
      width: 290px;
      height: 290px;
    }

    .home-orbit-two {
      width: 340px;
      height: 340px;
    }

    .home-visual-card {
      padding: 15px;
      transform: none;
    }

    .home-floating-badge {
      right: -4px;
      bottom: 10px;
    }

    .home-how-section,
    .home-projects-section {
      padding: 52px 0 0;
    }

    .home-steps-grid {
      grid-template-columns: 1fr;
      gap: 11px;
    }

    .home-step-card {
      min-height: auto;
      padding: 19px;
    }

    .home-step-top {
      margin-bottom: 15px;
    }

    .home-projects-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .home-project-card {
      align-items: stretch;
      flex-direction: column;
      padding: 19px;
    }

    .home-project-side {
      align-items: stretch;
      flex: auto;
      flex-direction: row;
      justify-content: space-between;
    }

    .home-project-budget {
      text-align: left;
    }

    .home-project-button {
      width: auto;
      min-width: 125px;
      align-self: flex-end;
    }

    .home-cta {
      margin: 55px 0 0;
      padding: 30px 23px;
    }

    .home-cta h2 {
      font-size: 30px;
    }
  }

  @media (max-width: 390px) {
    .home-hero-actions,
    .home-cta-actions {
      flex-direction: column;
    }

    .home-button {
      width: 100%;
      box-sizing: border-box;
    }

    .home-stats {
      flex-direction: column;
    }

    .home-stat-divider {
      display: none;
    }

    .home-project-side {
      align-items: stretch;
      flex-direction: column;
    }

    .home-project-button {
      width: 100%;
    }
  }
`;