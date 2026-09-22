import { useNavigate } from 'react-router-dom';

export default function PagamentoFalha() {
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.icon}></div>
        <h1 style={s.title}>Pagamento não realizado</h1>
        <p style={s.text}>
          Houve um problema com seu pagamento. Nenhum valor foi cobrado. Tente novamente ou use outro método de pagamento.
        </p>
        <button onClick={() => navigate('/dashboard')} style={s.btn}>
          Voltar ao painel
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
  text: { color: '#aaa', lineHeight: '1.6', margin: '0 0 32px' },
  btn: { backgroundColor: '#ff5555', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }
};