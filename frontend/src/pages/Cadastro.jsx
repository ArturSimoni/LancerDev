import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Cadastro() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('freelancer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');

  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password, role });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (name) => ({
    ...s.input,
    borderColor: focused === name ? '#ff6b00' : error ? '#ff3333' : '#222',
  });

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.cardHeader}>
          <Link to="/" style={s.logoLink}>Lancer<span style={s.logoAccent}>Dev</span></Link>
          <h1 style={s.title}>Criar uma conta</h1>
          <p style={s.subtitle}>Seja bem-vindo ao ecossistema LancerDev</p>
        </div>

        {error && (
          <div style={s.errorBox} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={s.form}>
          <div style={s.roleContainer}>
            <button
              type="button"
              onClick={() => setRole('freelancer')}
              style={{ ...s.roleBtn, ...(role === 'freelancer' ? s.roleBtnActive : {}) }}
            >
              Sou Freelancer
            </button>
            <button
              type="button"
              onClick={() => setRole('client')}
              style={{ ...s.roleBtn, ...(role === 'client' ? s.roleBtnActive : {}) }}
            >
              Sou Cliente
            </button>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused('')}
              required
              placeholder="Seu nome"
              style={inputStyle('name')}
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused('')}
              required
              placeholder="seuemail@exemplo.com"
              style={inputStyle('email')}
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused('')}
              required
              placeholder="Mínimo 6 caracteres"
              style={inputStyle('password')}
            />
          </div>

          <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Cadastrando...' : 'Concluir Cadastro'}
          </button>
        </form>

        <p style={s.footerText}>
          Já tem uma conta? <Link to="/login" style={s.footerLink}>Fazer login</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', backgroundColor: '#0a0a0a' },
  card: { width: '100%', maxWidth: '420px', backgroundColor: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '40px 36px' },
  cardHeader: { textAlign: 'center', marginBottom: '32px' },
  logoLink: { fontSize: '22px', fontWeight: '700', color: '#fff', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' },
  logoAccent: { color: '#ff6b00' },
  title: { fontSize: '22px', fontWeight: '700', margin: '0 0 6px', color: '#fff' },
  subtitle: { fontSize: '14px', color: '#666', margin: 0 },
  errorBox: { backgroundColor: 'rgba(255,51,51,0.08)', color: '#ff5555', border: '1px solid rgba(255,51,51,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '13px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  roleContainer: { display: 'flex', gap: '10px', marginBottom: '10px' },
  roleBtn: { flex: 1, padding: '10px', backgroundColor: '#0d0d0d', border: '1px solid #222', borderRadius: '8px', color: '#888', cursor: 'pointer', transition: 'all 0.2s' },
  roleBtnActive: { borderColor: '#ff6b00', color: '#ff6b00', backgroundColor: 'rgba(255,107,0,0.05)' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#bbb' },
  input: { width: '100%', padding: '11px 14px', backgroundColor: '#0d0d0d', border: '1px solid #222', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box', transition: 'border-color 0.15s' },
  submitBtn: { width: '100%', padding: '13px', backgroundColor: '#ff6b00', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginTop: '10px' },
  footerText: { textAlign: 'center', marginTop: '28px', fontSize: '13px', color: '#555' },
  footerLink: { color: '#ff6b00', textDecoration: 'none', fontWeight: '600' },
};