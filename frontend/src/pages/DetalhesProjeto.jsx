import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function DetalhesProjeto() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [coverText, setCoverText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        async function fetchProject() {
            try {
                const response = await api.get(`/projects/${id}`);
                setProject(response.data);
            } catch (error) {
                console.error('Erro ao buscar detalhes do projeto:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchProject();
    }, [id]);

    const handleSubmitProposal = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await api.post('/propostas', {
                projectId: id,
                totalAmount: parseFloat(amount),
                coverText: coverText
            });
            setSuccess(true);
            setTimeout(() => navigate('/propostas'), 2000);
        } catch (error) {
            console.error('Erro ao enviar proposta:', error);
            alert('Falha ao enviar proposta. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={s.page}>Carregando projeto...</div>;
    if (!project) return <div style={s.page}>Projeto não encontrado.</div>;

    return (
        <div style={s.page}>
            <div style={s.header}>
                <h1 style={s.title}>{project.title}</h1>
                <span style={s.budget}>Orçamento: R$ {Number(project.budget).toLocaleString('pt-BR')}</span>
            </div>
            
            <div style={s.content}>
                <section style={s.card}>
                    <h2 style={s.sectionTitle}>Descrição do Projeto</h2>
                    <p style={s.desc}>{project.description}</p>
                </section>

                <section style={s.card}>
                    <h2 style={s.sectionTitle}>Enviar Proposta</h2>
                    {success ? (
                        <div style={s.successBox}>✅ Proposta enviada com sucesso! Redirecionando...</div>
                    ) : (
                        <form onSubmit={handleSubmitProposal} style={s.form}>
                            <div style={s.inputGroup}>
                                <label style={s.label}>Valor Cobrado (R$)</label>
                                <input 
                                    type="number" step="0.01" required 
                                    value={amount} onChange={(e) => setAmount(e.target.value)}
                                    style={s.input} placeholder="Ex: 1500.00"
                                />
                            </div>
                            <div style={s.inputGroup}>
                                <label style={s.label}>Carta de Apresentação</label>
                                <textarea 
                                    required rows="5"
                                    value={coverText} onChange={(e) => setCoverText(e.target.value)}
                                    style={s.textarea} placeholder="Descreva por que você é ideal para este projeto..."
                                />
                            </div>
                            <button type="submit" disabled={submitting} style={s.btnPrimary}>
                                {submitting ? 'Enviando...' : 'Enviar Proposta'}
                            </button>
                        </form>
                    )}
                </section>
            </div>
        </div>
    );
}

const s = {
    page: { maxWidth: '800px', margin: '40px auto', padding: '0 20px', color: '#fff' },
    header: { borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' },
    title: { fontSize: '32px', margin: '0 0 10px 0' },
    budget: { fontSize: '18px', color: '#ff6b00', fontWeight: 'bold' },
    content: { display: 'flex', flexDirection: 'column', gap: '30px' },
    card: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', padding: '30px' },
    sectionTitle: { fontSize: '20px', margin: '0 0 20px 0', borderLeft: '3px solid #ff6b00', paddingLeft: '10px' },
    desc: { color: '#aaa', lineHeight: '1.6' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', color: '#ccc' },
    input: { padding: '12px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#000', color: '#fff' },
    textarea: { padding: '12px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#000', color: '#fff', resize: 'vertical' },
    btnPrimary: { backgroundColor: '#ff6b00', color: '#000', padding: '14px', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' },
    successBox: { backgroundColor: 'rgba(0, 200, 80, 0.1)', color: '#00c851', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #00c851' }
};