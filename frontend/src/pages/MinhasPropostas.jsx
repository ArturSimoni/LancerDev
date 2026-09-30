
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function MinhasPropostas() {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMyProposals() {
            try {
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
        switch (status) {
            case 'accepted':
                return {
                    bg: 'rgba(0,200,80,0.1)',
                    text: '#00c851',
                    label: 'Aceita'
                };
            case 'rejected':
                return {
                    bg: 'rgba(255,50,50,0.1)',
                    text: '#ff3232',
                    label: 'Recusada'
                };
            default:
                return {
                    bg: 'rgba(255,255,255,0.1)',
                    text: '#ccc',
                    label: 'Pendente'
                };
        }
    };

    const getMilestones = (proposal) => {
        if (Array.isArray(proposal.milestonesData)) {
            return proposal.milestonesData;
        }

        if (typeof proposal.milestonesData === 'string') {
            try {
                const parsed = JSON.parse(proposal.milestonesData);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }

        return [];
    };

    if (loading) {
        return <div style={s.page}>Carregando propostas...</div>;
    }

    return (
        <div style={s.page}>
            <h1 style={s.title}>Minhas Propostas</h1>
            <p style={s.subtitle}>
                Acompanhe o status das propostas que você enviou.
            </p>

            {proposals.length === 0 ? (
                <div style={s.empty}>
                    Você ainda não enviou nenhuma proposta.
                </div>
            ) : (
                <div style={s.list}>
                    {proposals.map((prop) => {
                        const statusStyle = getStatusColor(prop.status);
                        const milestones = getMilestones(prop);

                        return (
                            <div key={prop.id} style={s.card}>
                                <div style={s.cardTop}>
                                    <h3 style={s.projTitle}>
                                        Projeto: {prop.project?.title || `Projeto #${prop.projectId}`}
                                    </h3>

                                    <span
                                        style={{
                                            ...s.badge,
                                            backgroundColor: statusStyle.bg,
                                            color: statusStyle.text
                                        }}
                                    >
                                        {statusStyle.label}
                                    </span>
                                </div>

                                <div style={s.cardBody}>
                                    <p style={s.amount}>
                                        <strong>Sua Oferta:</strong>{' '}
                                        R$ {Number(prop.amount).toLocaleString('pt-BR')}
                                    </p>

                                    <p style={s.date}>
                                        <strong>Enviada em:</strong>{' '}
                                        {new Date(prop.createdAt).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>

                                {prop.coverText && (
                                    <div style={s.coverBox}>
                                        <h4 style={s.sectionTitle}>
                                            Sua apresentação
                                        </h4>
                                        <p style={s.coverText}>
                                            {prop.coverText}
                                        </p>
                                    </div>
                                )}

                                <div style={s.milestonesSection}>
                                    <div style={s.milestonesHeader}>
                                        <h4 style={s.sectionTitle}>
                                            Etapas da proposta
                                        </h4>

                                        <span style={s.milestoneCount}>
                                            {milestones.length}{' '}
                                            {milestones.length === 1 ? 'etapa' : 'etapas'}
                                        </span>
                                    </div>

                                    {milestones.length === 0 ? (
                                        <p style={s.noMilestones}>
                                            Esta proposta não possui etapas cadastradas.
                                        </p>
                                    ) : (
                                        <div style={s.milestonesList}>
                                            {milestones.map((milestone, index) => (
                                                <div key={index} style={s.milestoneCard}>
                                                    <div style={s.milestoneTop}>
                                                        <span style={s.milestoneNumber}>
                                                            Etapa {index + 1}
                                                        </span>

                                                        <strong style={s.milestoneAmount}>
                                                            R$ {Number(milestone.amount || 0).toLocaleString('pt-BR')}
                                                        </strong>
                                                    </div>

                                                    <h5 style={s.milestoneTitle}>
                                                        {milestone.title || 'Etapa sem título'}
                                                    </h5>

                                                    <p style={s.milestoneDescription}>
                                                        {milestone.description?.trim()
                                                            ? milestone.description
                                                            : 'Nenhuma descrição informada para esta etapa.'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Link
                                    to={`/projeto/${prop.projectId}`}
                                    style={s.link}
                                >
                                    Ver Projeto Original
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const s = {
    page: {
        maxWidth: '1000px',
        margin: '40px auto',
        padding: '0 20px',
        color: '#fff'
    },
    title: {
        fontSize: '32px',
        margin: '0 0 10px 0'
    },
    subtitle: {
        color: '#aaa',
        marginBottom: '40px'
    },
    empty: {
        backgroundColor: '#111',
        padding: '40px',
        textAlign: 'center',
        borderRadius: '10px',
        border: '1px solid #222',
        color: '#777'
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    card: {
        backgroundColor: '#111',
        border: '1px solid #222',
        borderRadius: '10px',
        padding: '24px'
    },
    cardTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '1px solid #222',
        paddingBottom: '16px',
        marginBottom: '16px',
        gap: '15px',
        flexWrap: 'wrap'
    },
    projTitle: {
        fontSize: '18px',
        margin: 0
    },
    badge: {
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    cardBody: {
        display: 'flex',
        gap: '40px',
        marginBottom: '20px',
        flexWrap: 'wrap'
    },
    amount: {
        margin: 0,
        fontSize: '16px',
        color: '#ddd'
    },
    date: {
        margin: 0,
        fontSize: '14px',
        color: '#888'
    },
    coverBox: {
        backgroundColor: '#181818',
        border: '1px solid #292929',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
    },
    sectionTitle: {
        color: '#ff6b00',
        fontSize: '14px',
        margin: 0,
        fontWeight: 'bold'
    },
    coverText: {
        color: '#ccc',
        fontSize: '14px',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
        margin: '10px 0 0'
    },
    milestonesSection: {
        marginBottom: '22px'
    },
    milestonesHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px'
    },
    milestoneCount: {
        color: '#888',
        fontSize: '12px'
    },
    milestonesList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    milestoneCard: {
        backgroundColor: '#181818',
        border: '1px solid #292929',
        borderLeft: '3px solid #ff6b00',
        borderRadius: '7px',
        padding: '14px 16px'
    },
    milestoneTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '9px'
    },
    milestoneNumber: {
        color: '#ff6b00',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    milestoneAmount: {
        color: '#00c851',
        fontSize: '14px',
        whiteSpace: 'nowrap'
    },
    milestoneTitle: {
        color: '#fff',
        fontSize: '15px',
        margin: '0 0 7px'
    },
    milestoneDescription: {
        color: '#aaa',
        fontSize: '13px',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
        margin: 0
    },
    noMilestones: {
        color: '#777',
        fontSize: '13px',
        backgroundColor: '#181818',
        padding: '14px',
        borderRadius: '7px',
        margin: 0
    },
    link: {
        display: 'inline-block',
        color: '#ff6b00',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: 'bold'
    }
};
