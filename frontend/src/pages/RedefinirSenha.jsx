import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Link de recuperação inválido. Solicite um novo link.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve possuir pelo menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password,
      });

      setMessage(response.data.message);

      window.setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível redefinir sua senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={s.page}>
      <section style={s.card}>
        <Link to="/" style={s.logo}>
          Lancer<span style={s.accent}>Dev</span>
        </Link>

        <div style={s.icon}>🔒</div>
        <h1 style={s.title}>Criar nova senha</h1>
        <p style={s.subtitle}>
          Escolha uma nova senha para acessar sua conta.
        </p>

        {message && <div style={s.success}>{message}</div>}
        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <label htmlFor="password" style={s.label}>Nova senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo de 8 caracteres"
            autoComplete="new-password"
            minLength={8}
            required
            style={s.input}
          />

          <label htmlFor="confirmPassword" style={s.label}>Confirmar nova senha</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Digite a senha novamente"
            autoComplete="new-password"
            minLength={8}
            required
            style={s.input}
          />

          <button type="submit" disabled={loading || !!message} style={s.button}>
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>

        <Link to="/login" style={s.backLink}>Voltar para o login</Link>
      </section>
    </main>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: '#080808',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: '430px',
    padding: '38px',
    background: '#111',
    border: '1px solid #292929',
    borderRadius: '16px',
    boxSizing: 'border-box',
    textAlign: 'center',
  },
  logo: {
    display: 'inline-block',
    marginBottom: '25px',
    color: '#fff',
    fontSize: '25px',
    fontWeight: '800',
    textDecoration: 'none',
  },
  accent: {
    color: '#ff6b00',
  },
  icon: {
    width: '52px',
    height: '52px',
    margin: '0 auto 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '14px',
    background: 'rgba(255, 107, 0, 0.1)',
    color: '#ff8a36',
    fontSize: '24px',
  },
  title: {
    margin: '0 0 10px',
    color: '#fff',
    fontSize: '24px',
  },
  subtitle: {
    margin: '0 0 25px',
    color: '#999',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    textAlign: 'left',
  },
  label: {
    color: '#ddd',
    fontSize: '13px',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    padding: '13px',
    border: '1px solid #333',
    borderRadius: '8px',
    background: '#090909',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  button: {
    marginTop: '10px',
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    background: '#ff6b00',
    color: '#111',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  success: {
    marginBottom: '18px',
    padding: '12px',
    border: '1px solid #285d3a',
    borderRadius: '8px',
    background: '#102619',
    color: '#9be0ad',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  error: {
    marginBottom: '18px',
    padding: '12px',
    border: '1px solid #632d2d',
    borderRadius: '8px',
    background: '#2b1414',
    color: '#ff9999',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  backLink: {
    display: 'inline-block',
    marginTop: '23px',
    color: '#ff8a36',
    fontSize: '13px',
    textDecoration: 'none',
  },
};