import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const howItWorks = [
    { icon: '', title: 'Cliente publica o projeto', desc: 'Descreva o escopo, defina o orçamento e os marcos esperados.' },
    { icon: '', title: 'Freelancer envia proposta', desc: 'Desenvolvedores qualificados enviam propostas estruturadas com milestones.' },
    { icon: '', title: 'Pagamento em garantia', desc: 'O valor fica retido em escrow e só é liberado após sua aprovação.' },
    { icon: '', title: 'Entrega e avaliação', desc: 'Homologue cada etapa e avalie o profissional ao final do projeto.' },
];

const stats = [
    { value: '100%', label: 'Pagamentos protegidos' },
    { value: 'Dev', label: 'Para devs, por devs' },
    { value: 'Escrow', label: 'Garantia em cada marco' },
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

    return (
        <div style={s.page}>

            {/* ── HERO ── */}
            <section style={s.hero}>
                <div style={s.heroInner}>
                    <span style={s.eyebrow}>Plataforma de freelance para desenvolvedores</span>
                    <h1 style={s.heroTitle}>
                        Conecte-se ao próximo<br />
                        <span style={s.accent}>projeto que vale a pena.</span>
                    </h1>
                    <p style={s.heroSub}>
                        LancerDev é onde clientes publicam vagas reais e devs
                        entregam com segurança — pagamento em garantia, marcos
                        claros, sem surpresas.
                    </p>
                    <div style={s.heroCtas}>
                        {isLoggedIn ? (
                            <Link to="/dashboard" style={s.btnPrimary}>Ir para o dashboard</Link>
                        ) : (
                            <>
                                <Link to="/register" style={s.btnPrimary}>Criar conta grátis</Link>
                                <Link to="/login" style={s.btnGhost}>Entrar</Link>
                            </>
                        )}
                    </div>
                    <div style={s.statsRow}>
                        {stats.map((st) => (
                            <div key={st.label} style={s.statItem}>
                                <span style={s.statValue}>{st.value}</span>
                                <span style={s.statLabel}>{st.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── COMO FUNCIONA ── */}
            <section style={s.section}>
                <div style={s.sectionHeader}>
                    <h2 style={s.sectionTitle}>Como funciona</h2>
                    <p style={s.sectionSub}>Do contrato à entrega, tudo dentro da plataforma.</p>
                </div>
                <div style={s.stepsGrid}>
                    {howItWorks.map((step, i) => (
                        <div key={i} style={s.stepCard}>
                            <span style={s.stepIcon}>{step.icon}</span>
                            <h3 style={s.stepTitle}>{step.title}</h3>
                            <p style={s.stepDesc}>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── PROJETOS ── */}
            <section style={s.section}>
                <div style={s.sectionHeader}>
                    <h2 style={s.sectionTitle}>Projetos abertos agora</h2>
                    <p style={s.sectionSub}>Oportunidades publicadas por clientes esperando proposta.</p>
                </div>

                {loading ? (
                    <div style={s.emptyState}>
                        <span style={s.emptyIcon}>⏳</span>
                        <p style={s.emptyText}>Carregando oportunidades...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div style={s.emptyState}>
                        <span style={s.emptyIcon}>📭</span>
                        <p style={s.emptyText}>Nenhum projeto aberto no momento.</p>
                        <Link to="/publicar" style={s.btnPrimary}>Publicar o primeiro projeto</Link>
                    </div>
                ) : (
                    <div style={s.grid}>
                        {projects.map((project) => (
                            <div key={project.id} style={s.card}>
                                <div style={s.cardTop}>
                                    <span style={s.badge}>Aberto</span>
                                    <span style={s.budget}>
                                        R$ {Number(project.budget).toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                <h3 style={s.cardTitle}>{project.title}</h3>
                                <p style={s.cardDesc}>
                                    {project.description.length > 140
                                        ? `${project.description.substring(0, 140)}...`
                                        : project.description}
                                </p>
                                <div style={s.cardFooter}>
                                    <span style={s.clientName}>Por: {project.client?.name}</span>
                                    
                                    {/* ── BOTÃO MODIFICADO AQUI ── */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            
                                            if (isLoggedIn) {
                                                navigate(`/projeto/${project.id}`);
                                            } else {
                                                navigate('/login');
                                            }
                                        }}
                                        style={s.btnOutline}
                                        onMouseEnter={e => {
                                            e.target.style.backgroundColor = '#ff6b00';
                                            e.target.style.color = '#000';
                                        }}
                                        onMouseLeave={e => {
                                            e.target.style.backgroundColor = 'transparent';
                                            e.target.style.color = '#ff6b00';
                                        }}
                                    >
                                        Ver detalhes
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── CTA FINAL ── */}
            <section style={s.ctaBanner}>
                <h2 style={s.ctaTitle}>Pronto para começar?</h2>
                <p style={s.ctaSub}>Crie sua conta e publique ou candidate-se a projetos em minutos.</p>
                <div style={s.heroCtas}>
                    <Link to="/register" style={s.btnPrimary}>Criar conta grátis</Link>
                    <Link to="/login" style={{ ...s.btnGhost, borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
                        Já tenho conta
                    </Link>
                </div>
            </section>

        </div>
    );
}

const s = {
    page: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px 60px', color: '#fff' },

    // Hero
    hero: {
        padding: '80px 0 60px',
        borderBottom: '1px solid #222',
        marginBottom: '60px',
    },
    heroInner: { maxWidth: '680px' },
    eyebrow: { fontSize: '12px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ff6b00', display: 'block', marginBottom: '16px' },
    heroTitle: { fontSize: '48px', fontWeight: '700', lineHeight: '1.15', margin: '0 0 20px', letterSpacing: '-0.02em' },
    accent: { color: '#ff6b00' },
    heroSub: { fontSize: '17px', color: '#999', lineHeight: '1.7', margin: '0 0 32px', maxWidth: '560px' },
    heroCtas: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '48px' },
    btnPrimary: { backgroundColor: '#ff6b00', color: '#000', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'inline-block' },
    btnGhost: { backgroundColor: 'transparent', color: '#ff6b00', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', border: '1px solid #ff6b00', display: 'inline-block' },
    statsRow: { display: 'flex', gap: '40px', flexWrap: 'wrap' },
    statItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
    statValue: { fontSize: '22px', fontWeight: '700', color: '#fff' },
    statLabel: { fontSize: '12px', color: '#666', letterSpacing: '0.05em' },

    section: { marginBottom: '72px' },
    sectionHeader: { marginBottom: '36px' },
    sectionTitle: { fontSize: '26px', fontWeight: '700', margin: '0 0 8px', borderLeft: '3px solid #ff6b00', paddingLeft: '12px' },
    sectionSub: { fontSize: '15px', color: '#777', margin: '0', paddingLeft: '15px' },

    stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
    stepCard: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', padding: '28px 24px' },
    stepIcon: { fontSize: '28px', display: 'block', marginBottom: '16px' },
    stepTitle: { fontSize: '15px', fontWeight: '600', margin: '0 0 8px' },
    stepDesc: { fontSize: '13px', color: '#777', lineHeight: '1.6', margin: 0 },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' },
    card: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'border-color 0.2s' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
    badge: { backgroundColor: 'rgba(0,200,80,0.1)', color: '#00c851', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' },
    budget: { color: '#ff6b00', fontWeight: '700', fontSize: '15px' },
    cardTitle: { fontSize: '17px', fontWeight: '600', margin: '0 0 10px', lineHeight: '1.3' },
    cardDesc: { color: '#777', fontSize: '13px', lineHeight: '1.6', margin: '0 0 20px', flexGrow: 1 },
    cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #1e1e1e' },
    clientName: { fontSize: '12px', color: '#555' },
    btnOutline: { backgroundColor: 'transparent', border: '1px solid #ff6b00', color: '#ff6b00', padding: '7px 14px', borderRadius: '5px', cursor: 'pointer', fontWeight: '500', fontSize: '13px', transition: 'all 0.2s' },

    emptyState: { textAlign: 'center', padding: '60px 20px', backgroundColor: '#111', borderRadius: '10px', border: '1px solid #222' },
    emptyIcon: { fontSize: '40px', display: 'block', marginBottom: '16px' },
    emptyText: { color: '#666', marginBottom: '24px', fontSize: '15px' },

    ctaBanner: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', padding: '60px 40px', textAlign: 'center' },
    ctaTitle: { fontSize: '32px', fontWeight: '700', margin: '0 0 12px' },
    ctaSub: { color: '#777', fontSize: '16px', margin: '0 0 32px' },
};