import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Home() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
        <div style={styles.container}>
            {/* Hero Section */}
            <section style={styles.hero}>
                <h1 style={styles.heroTitle}>Conectando os melhores Desenvolvedores aos melhores Projetos</h1>
                <p style={styles.heroSubtitle}>
                    Uma plataforma feita de dev para dev. Publique vagas ou encontre seu próximo freela aqui no LancerDev.
                </p>
                <nav style={{ marginTop: '20px' }}>
                    <Link to="/login" style={styles.navLink}>Ir para Login</Link> | <Link to="/dashboard" style={styles.navLink}>Ir para Dashboard</Link>
                </nav>
            </section>

            {/* Seção de Projetos */}
            <section style={styles.projectsSection}>
                <h2 style={styles.sectionTitle}>Projetos Recentes Disponíveis</h2>

                {loading ? (
                    <p style={styles.message}>Carregando oportunidades...</p>
                ) : projects.length === 0 ? (
                    <p style={styles.message}>Nenhum projeto aberto no momento. Que tal publicar o primeiro?</p>
                ) : (
                    <div style={styles.grid}>
                        {projects.map((project) => (
                            <div key={project.id} style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <span style={styles.badge}>Aberto</span>
                                    <span style={styles.budget}>R$ {Number(project.budget).toLocaleString('pt-BR')}</span>
                                </div>
                                <h3 style={styles.projectTitle}>{project.title}</h3>
                                <p style={styles.projectDescription}>
                                    {project.description.length > 140
                                        ? `${project.description.substring(0, 140)}...`
                                        : project.description}
                                </p>
                                <div style={styles.cardFooter}>
                                    <span style={styles.clientName}>Por: {project.client?.name}</span>
                                    <button
                                        onClick={() => {
                                            
                                            const token = localStorage.getItem('@LancerDev:token');

                                            if (token) {
                                                navigate('/dashboard');
                                            } else {
                                                navigate('/login');
                                            }
                                        }}
                                        style={styles.actionBtn}
                                    >
                                        Ver Detalhes
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '20px', color: '#fff' },
    hero: { textAlign: 'center', padding: '60px 20px', backgroundColor: '#1e1e1e', borderRadius: '8px', marginBottom: '40px', border: '1px solid #222' },
    heroTitle: { fontSize: '36px', fontWeight: 'bold', marginBottom: '15px' },
    heroSubtitle: { color: '#aaa', fontSize: '16px', maxWidth: '600px', margin: '0 auto' },
    navLink: { color: '#ff6b00', textDecoration: 'none', margin: '0 10px', fontWeight: '500' },
    projectsSection: { marginBottom: '5px' },
    sectionTitle: { fontSize: '24px', marginBottom: '25px', borderLeft: '4px solid #ff6b00', paddingLeft: '10px' },
    message: { color: '#aaa', textAlign: 'center', fontSize: '16px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
    card: { backgroundColor: '#1e1e1e', border: '1px solid #222', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    badge: { backgroundColor: 'rgba(0, 200, 80, 0.1)', color: '#00c851', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
    budget: { color: '#ff6b00', fontWeight: 'bold', fontSize: '16px' },
    projectTitle: { fontSize: '18px', marginBottom: '10px', fontWeight: '600' },
    projectDescription: { color: '#aaa', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px', flexGrow: 1 },
    cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid #222' },
    clientName: { fontSize: '13px', color: '#aaa' },
    actionBtn: { backgroundColor: 'transparent', border: '1px solid #ff6b00', color: '#ff6b00', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '13px', transition: '0.2s' }
};