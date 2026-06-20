import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function MinhasPropostas() {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMyProposals() {
            try {
                // A rota está correta: /propostas/minhas
                const response = await api.get('/propostas/minhas');
                setProposals(response.data);
            } catch (error) {
                console.error('Erro ao buscar propostas:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchMyProposals();
    }, []);

    const getStatusColor = (status) => {
        switch(status) {
            case 'accepted': return { bg: 'rgba(0,200,80,0.1)', text: '#00c851', label: 'Aceita' };
            case 'rejected': return { bg: 'rgba(255,50,50,0.1)', text: '#ff3232', label: 'Recusada' };
            default: return { bg: 'rgba(255,255,255,0.1)', text: '#ccc', label: 'Pendente' };
        }
    };

    if (loading) return <div style={s.page}>Carregando propostas...</div>;

    return (
        <div style={s.page}>
            <h1 style={s.title}>Minhas Propostas</h1>
            <p style={s.subtitle}>Acompanhe o status das propostas que você enviou.</p>

            {proposals.length === 0 ? (
                <div style={s.empty}>Você ainda não enviou nenhuma proposta.</div>
            ) : (
                <div style={s.list}>
                    {proposals.map((prop) => {
                        const statusStyle = getStatusColor(prop.status);
                        return (
                            <div key={prop.id} style={s.card}>
                                <div style={s.cardTop}>
                                    <h3 style={s.projTitle}>Projeto: {prop.project?.title || `Projeto #${prop.projectId}`}</h3>
                                    <span style={{
                                        ...s.badge, 
                                        backgroundColor: statusStyle.bg, 
                                        color: statusStyle.text 
                                    }}>
                                        {statusStyle.label}
                                    </span>
                                </div>
                                <div style={s.cardBody}>
                                    <p style={s.amount}><strong>Sua Oferta:</strong> R$ {Number(prop.amount).toLocaleString('pt-BR')}</p>
                                    {/* Ajustado de prop.created_at para prop.createdAt */}
                                    <p style={s.date}><strong>Enviada em:</strong> {new Date(prop.createdAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <Link to={`/projeto/${prop.projectId}`} style={s.link}>Ver Projeto Original</Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const s = {
    page: { maxWidth: '1000px', margin: '40px auto', padding: '0 20px', color: '#fff' },
    title: { fontSize: '32px', margin: '0 0 10px 0' },
    subtitle: { color: '#aaa', marginBottom: '40px' },
    empty: { backgroundColor: '#111', padding: '40px', textAlign: 'center', borderRadius: '10px', border: '1px solid #222', color: '#777' },
    list: { display: 'flex', flexDirection: 'column', gap: '20px' },
    card: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '10px', padding: '24px' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #222', paddingBottom: '16px', marginBottom: '16px' },
    projTitle: { fontSize: '18px', margin: 0 },
    badge: { padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' },
    cardBody: { display: 'flex', gap: '40px', marginBottom: '20px' },
    amount: { margin: 0, fontSize: '16px', color: '#ddd' },
    date: { margin: 0, fontSize: '14px', color: '#888' },
    link: { color: '#ff6b00', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }
};