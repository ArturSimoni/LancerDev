import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
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
    borderColor: focused === name ? '#ff6b00' : error ? '#482323' : '#292929',
    boxShadow: focused === name ? '0 0 0 3px rgba(255, 107, 0, 0.12)' : 'none',
  });

  return (
    <div style={s.page}>
      <div style={s.backgroundGlow} />

      <main style={s.card} className="lancer-login-card">
        <header style={s.cardHeader}>
          <Link to="/" style={s.logoLink}>
            Lancer<span style={s.logoAccent}>Dev</span>
          </Link>

          <div style={s.iconContainer}>
            <span style={s.loginIcon}>↗</span>
          </div>

          <h1 style={s.title}>Bem-vindo de volta</h1>
          <p style={s.subtitle}>
            Entre na sua conta para continuar sua jornada.
          </p>
        </header>

        {error && (
          <div style={s.errorBox} role="alert">
            <span style={s.errorIcon}>!</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.fieldGroup}>
            <label style={s.label} htmlFor="email">
              E-mail
            </label>

            <div style={s.inputWrapper}>
              <span style={s.fieldIcon}>✉</span>
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
          </div>

          <div style={s.fieldGroup}>
            <div style={s.labelRow}>
              <label style={s.label} htmlFor="password">
                Senha
              </label>

              <Link to="/recuperar-senha" style={s.forgotLink}>
                Esqueci minha senha
              </Link>
            </div>

            <div style={s.inputWrapper}>
              <span style={s.fieldIcon}>▣</span>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                required
                autoComplete="current-password"
                placeholder="Digite sua senha"
                style={{ ...inputStyle('password'), paddingRight: '48px' }}
              />

              <button
                type="button"
                onClick={() => setShowPass((value) => !value)}
                style={s.eyeBtn}
                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPass ? '◉' : '◎'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...s.submitBtn,
              opacity: loading ? 0.75 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span style={s.loadingRow}>
                <span style={s.spinner} />
                Autenticando...
              </span>
            ) : (
              <>
                Entrar na plataforma
                <span style={s.buttonArrow}>→</span>
              </>
            )}
          </button>
        </form>

        <div style={s.separator}>
          <span style={s.separatorLine} />
          <small>AINDA NÃO FAZ PARTE?</small>
          <span style={s.separatorLine} />
        </div>

        <p style={s.footerText}>
          Crie sua conta gratuitamente e comece a conectar oportunidades.
        </p>

        <Link to="/cadastro" style={s.registerBtn} className="lancer-register">
          Criar minha conta
        </Link>

        <footer style={s.bottomText}>
          <span>© {new Date().getFullYear()} LancerDev</span>
          <span>Conectando talentos e oportunidades.</span>
        </footer>
      </main>

      <style>{`
        @keyframes lancer-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes lancer-appear {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .lancer-register:hover {
          background: rgba(255, 107, 0, 0.1) !important;
          border-color: #ff6b00 !important;
        }

        @media (max-width: 480px) {
          .lancer-login-card {
            padding: 30px 22px !important;
          }
        }
      `}</style>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    background: '#080808',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    fontFamily: 'Inter, Arial, sans-serif',
  },
  backgroundGlow: {
    position: 'absolute',
    width: '420px',
    height: '420px',
    borderRadius: '50%',
    background: 'rgba(255, 107, 0, 0.08)',
    filter: 'blur(110px)',
    top: '10%',
    left: '50%',
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: '42px 38px 28px',
    background: 'rgba(17, 17, 17, 0.96)',
    border: '1px solid #242424',
    borderRadius: '18px',
    position: 'relative',
    zIndex: 1,
    boxSizing: 'border-box',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.45)',
    animation: 'lancer-appear 0.45s ease-out',
  },
  cardHeader: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logoLink: {
    display: 'inline-block',
    marginBottom: '26px',
    color: '#fff',
    fontSize: '25px',
    fontWeight: '800',
    letterSpacing: '-1px',
    textDecoration: 'none',
  },
  logoAccent: {
    color: '#ff6b00',
  },
  iconContainer: {
    width: '52px',
    height: '52px',
    margin: '0 auto 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '15px',
    background: 'rgba(255, 107, 0, 0.1)',
    border: '1px solid rgba(255, 107, 0, 0.2)',
  },
  loginIcon: {
    color: '#ff6b00',
    fontSize: '27px',
    fontWeight: '700',
  },
  title: {
    margin: '0 0 9px',
    color: '#fff',
    fontSize: '25px',
    fontWeight: '750',
    letterSpacing: '-0.7px',
  },
  subtitle: {
    margin: 0,
    color: '#858585',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    marginBottom: '22px',
    border: '1px solid rgba(255, 70, 70, 0.25)',
    borderRadius: '9px',
    background: 'rgba(255, 51, 51, 0.08)',
    color: '#ff7777',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  errorIcon: {
    width: '19px',
    height: '19px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #ff7777',
    borderRadius: '50%',
    fontSize: '12px',
    fontWeight: '700',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '21px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '9px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },
  label: {
    color: '#d2d2d2',
    fontSize: '13px',
    fontWeight: '600',
  },
  forgotLink: {
    color: '#ff8a36',
    fontSize: '12px',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  fieldIcon: {
    position: 'absolute',
    left: '14px',
    zIndex: 1,
    color: '#777',
    fontSize: '15px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '13px 14px 13px 42px',
    background: '#0b0b0b',
    border: '1px solid #292929',
    borderRadius: '9px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  eyeBtn: {
    position: 'absolute',
    right: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: '#858585',
    fontSize: '19px',
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    minHeight: '48px',
    marginTop: '4px',
    padding: '13px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    border: 'none',
    borderRadius: '9px',
    background: '#ff6b00',
    color: '#101010',
    fontSize: '14px',
    fontWeight: '800',
    transition: 'background 0.2s, transform 0.2s',
  },
  buttonArrow: {
    fontSize: '19px',
    lineHeight: 1,
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  spinner: {
    width: '15px',
    height: '15px',
    border: '2px solid rgba(0, 0, 0, 0.25)',
    borderTopColor: '#101010',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'lancer-spin 0.65s linear infinite',
  },
  separator: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '29px 0 15px',
    color: '#777',
    fontSize: '10px',
    letterSpacing: '0.8px',
    whiteSpace: 'nowrap',
  },
  separatorLine: {
    flex: 1,
    height: '1px',
    background: '#292929',
  },
  footerText: {
    margin: '0 0 15px',
    color: '#777',
    textAlign: 'center',
    fontSize: '12px',
    lineHeight: 1.6,
  },
  registerBtn: {
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #333',
    borderRadius: '9px',
    color: '#f2f2f2',
    fontSize: '13px',
    fontWeight: '700',
    textDecoration: 'none',
    transition: 'background 0.2s, border-color 0.2s',
  },
  bottomText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
    marginTop: '25px',
    paddingTop: '19px',
    borderTop: '1px solid #242424',
    color: '#555',
    fontSize: '11px',
  },
};