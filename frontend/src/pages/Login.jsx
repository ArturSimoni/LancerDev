import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('@LancerDev:token', token);
      localStorage.setItem('@LancerDev:role', user.role);
      localStorage.setItem('@LancerDev:user', JSON.stringify(user));
      window.dispatchEvent(new Event('authChange'));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (name) => ({
    ...s.input,
    borderColor: focused === name ? '#ff6b00' : error ? '#ff3333' : '#222',
    outline: 'none',
  });

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Cabeçalho */}
        <div style={s.cardHeader}>
          <Link to="/" style={s.logoLink}>
            Lancer<span style={s.logoAccent}>Dev</span>
          </Link>
          <h1 style={s.title}>Bem-vindo de volta</h1>
          <p style={s.subtitle}>Entre na sua conta para continuar</p>
        </div>

        {/* Erro */}
        {error && (
          <div style={s.errorBox} role="alert">
            <span style={s.errorIcon}>⚠</span> {error}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={s.form}>

          <div style={s.fieldGroup}>
            <label style={s.label} htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused('')}
              required
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              style={inputStyle('email')}
            />
          </div>

          <div style={s.fieldGroup}>
            <div style={s.labelRow}>
              <label style={s.label} htmlFor="password">Senha</label>
              <Link to="/recuperar-senha" style={s.forgotLink}>Esqueci minha senha</Link>
            </div>
            <div style={s.passwordWrapper}>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{ ...inputStyle('password'), paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={s.eyeBtn}
                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}
            onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = '#e05e00'; }}
            onMouseLeave={e => { e.target.style.backgroundColor = '#ff6b00'; }}
          >
            {loading ? (
              <span style={s.loadingRow}>
                <span style={s.spinner} /> Autenticando...
              </span>
            ) : 'Entrar'}
          </button>

        </form>

        {/* Rodapé */}
        <p style={s.footerText}>
          Não tem uma conta?{' '}
          <Link to="/cadastro" style={s.footerLink}>Criar conta grátis</Link>
        </p>

      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    backgroundColor: '#0a0a0a',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: '12px',
    padding: '40px 36px',
  },

  // Header
  cardHeader: { textAlign: 'center', marginBottom: '32px' },
  logoLink: { fontSize: '22px', fontWeight: '700', color: '#fff', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' },
  logoAccent: { color: '#ff6b00' },
  title: { fontSize: '22px', fontWeight: '700', margin: '0 0 6px', color: '#fff' },
  subtitle: { fontSize: '14px', color: '#666', margin: 0 },

  // Error
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    backgroundColor: 'rgba(255,51,51,0.08)',
    color: '#ff5555',
    border: '1px solid rgba(255,51,51,0.2)',
    padding: '12px 14px', borderRadius: '8px',
    marginBottom: '24px', fontSize: '13px',
  },
  errorIcon: { fontSize: '14px', flexShrink: 0 },

  // Form
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: '13px', fontWeight: '500', color: '#bbb' },
  forgotLink: { fontSize: '12px', color: '#555', textDecoration: 'none' },
  input: {
    width: '100%',
    padding: '11px 14px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #222',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },

  // Password toggle
  passwordWrapper: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: '12px', top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '16px', padding: '0', lineHeight: 1,
    opacity: 0.5,
  },

  // Submit
  submitBtn: {
    width: '100%', padding: '13px',
    backgroundColor: '#ff6b00', color: '#000',
    border: 'none', borderRadius: '8px',
    fontWeight: '700', fontSize: '15px',
    cursor: 'pointer', marginTop: '4px',
    transition: 'background-color 0.15s',
  },
  loadingRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  spinner: {
    width: '14px', height: '14px',
    border: '2px solid rgba(0,0,0,0.2)',
    borderTopColor: '#000',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.6s linear infinite',
  },

  // Footer
  footerText: { textAlign: 'center', marginTop: '28px', fontSize: '13px', color: '#555' },
  footerLink: { color: '#ff6b00', textDecoration: 'none', fontWeight: '600' },
};

// Injeta keyframe do spinner globalmente (uma vez)
if (typeof document !== 'undefined' && !document.getElementById('ld-spin')) {
  const st = document.createElement('style');
  st.id = 'ld-spin';
  st.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(st);
}
