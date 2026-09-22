import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function PagamentoSucesso() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get('status');
  const isPending = status === 'pending' || status === 'in_process';

  useEffect(() => {
    const timer = setTimeout(() => navigate('/dashboard'), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.icon}>{isPending ? '⏳' : '✅'}</div>
        <h1 style={s.title}>
          {isPending ? 'Pagamento em processamento' : 'Pagamento confirmado!'}
        </h1>
        <p style={s.text}>
          {isPending
            ? 'Seu pagamento está sendo processado. Você será notificado quando for confirmado.'
            : 'O valor foi recebido e está em escrow. Será liberado ao freelancer conforme os marcos forem aprovados.'}
        </p>
        <p style={s.redirect}>Redirecionando para o painel em 5 segundos...</p>
        <button onClick={() => navigate('/dashboard')} style={s.btn}>
          Ir para o painel agora
        </button>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' },
  card: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', padding: '48px 40px', textAlign: 'center', maxWidth: '480px', width: '100%' },
  icon: { fontSize: '56px', marginBottom: '20px' },
  title: { fontSize: '24px', fontWeight: 'bold', margin: '0 0 16px' },
  text: { color: '#aaa', lineHeight: '1.6', margin: '0 0 24px' },
  redirect: { color: '#555', fontSize: '13px', margin: '0 0 24px' },
  btn: { backgroundColor: '#ff6b00', color: '#000', border: 'none', padding: '12px 28px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }
};