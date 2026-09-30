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
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register', { name, email, password, role });
      navigate('/login');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Erro ao criar conta. Verifique os dados e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (field) => ({
    ...s.input,
    borderColor: focused === field ? '#ff6b00' : error ? '#482323' : '#292929',
    boxShadow: focused === field ? '0 0 0 3px rgba(255, 107, 0, 0.12)' : 'none',
  });

  return (
    <div style={s.page}>
      <div style={s.backgroundGlow} />

      <main style={s.card} className="lancer-register-card">
        <header style={s.cardHeader}>
          <Link to="/" style={s.logoLink}>
            Lancer<span style={s.logoAccent}>Dev</span>
          </Link>

          <div style={s.iconContainer}>
            <span style={s.registerIcon}>✦</span>
          </div>

          <h1 style={s.title}>Crie sua conta</h1>
          <p style={s.subtitle}>
            Faça parte do ecossistema LancerDev e conecte-se a novas oportunidades.
          </p>
        </header>

        {error && (
          <div style={s.errorBox} role="alert">
            <span style={s.errorIcon}>!</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} style={s.form}>
          <div style={s.roleSection}>
            <span style={s.sectionLabel}>Como deseja utilizar a plataforma?</span>

            <div style={s.roleContainer}>
              <button
                type="button"
                onClick={() => setRole('freelancer')}
                style={{
                  ...s.roleBtn,
                  ...(role === 'freelancer' ? s.roleBtnActive : {}),
                }}
                aria-pressed={role === 'freelancer'}
              >
                <span style={s.roleIcon}>⌘</span>
                <span style={s.roleTitle}>Freelancer</span>
                <span style={s.roleDescription}>Quero oferecer meus serviços</span>
                {role === 'freelancer' && <span style={s.selectedMark}>✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setRole('client')}
                style={{
                  ...s.roleBtn,
                  ...(role === 'client' ? s.roleBtnActive : {}),
                }}
                aria-pressed={role === 'client'}
              >
                <span style={s.roleIcon}>▣</span>
                <span style={s.roleTitle}>Cliente</span>
                <span style={s.roleDescription}>Quero contratar profissionais</span>
                {role === 'client' && <span style={s.selectedMark}>✓</span>}
              </button>
            </div>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label} htmlFor="name">
              Nome completo
            </label>
            <div style={s.inputWrapper}>
              <span style={s.fieldIcon}>♙</span>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused('')}
                required
                autoComplete="name"
                placeholder="Digite seu nome completo"
                style={inputStyle('name')}
              />
            </div>
          </div>

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
            <label style={s.label} htmlFor="password">
              Senha
            </label>
            <div style={s.inputWrapper}>
              <span style={s.fieldIcon}>▣</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Crie uma senha com pelo menos 6 caracteres"
                style={{ ...inputStyle('password'), paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                style={s.eyeBtn}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? '◉' : '◎'}
              </button>
            </div>
            <span style={s.helperText}>Utilize no mínimo 6 caracteres.</span>
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
                Cadastrando...
              </span>
            ) : (
              <>
                Concluir cadastro
                <span style={s.buttonArrow}>→</span>
              </>
            )}
          </button>
        </form>

        <div style={s.separator}>
          <span style={s.separatorLine} />
          <small>JÁ POSSUI UMA CONTA?</small>
          <span style={s.separatorLine} />
        </div>

        <p style={s.footerText}>
          Entre na plataforma para continuar de onde parou.
        </p>

        <Link to="/login" style={s.loginBtn} className="lancer-login-link">
          Fazer login
        </Link>

        <footer style={s.bottomText}>
          <span>© {new Date().getFullYear()} LancerDev</span>
          <span>Conectando talentos e oportunidades.</span>
        </footer>
      </main>

      <style>{`
        @keyframes lancer-register-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes lancer-register-appear {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .lancer-login-link:hover {
          background: rgba(255, 107, 0, 0.1) !important;
          border-color: #ff6b00 !important;
        }

        @media (max-width: 480px) {
          .lancer-register-card {
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
    maxWidth: '480px',
    padding: '40px 38px 28px',
    background: 'rgba(17, 17, 17, 0.96)',
    border: '1px solid #242424',
    borderRadius: '18px',
    position: 'relative',
    zIndex: 1,
    boxSizing: 'border-box',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.45)',
    animation: 'lancer-register-appear 0.45s ease-out',
  },
  cardHeader: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoLink: {
    display: 'inline-block',
    marginBottom: '23px',
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
    margin: '0 auto 17px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '15px',
    background: 'rgba(255, 107, 0, 0.1)',
    border: '1px solid rgba(255, 107, 0, 0.2)',
  },
  registerIcon: {
    color: '#ff6b00',
    fontSize: '26px',
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
    maxWidth: '340px',
    margin: '0 auto',
    color: '#858585',
    fontSize: '13px',
    lineHeight: 1.6,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    marginBottom: '20px',
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
    gap: '18px',
  },
  roleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '2px',
  },
  sectionLabel: {
    color: '#d2d2d2',
    fontSize: '13px',
    fontWeight: '600',
  },
  roleContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  roleBtn: {
    position: 'relative',
    minHeight: '112px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: '6px',
    padding: '15px',
    border: '1px solid #292929',
    borderRadius: '11px',
    background: '#0b0b0b',
    color: '#888',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
  },
  roleBtnActive: {
    borderColor: '#ff6b00',
    background: 'rgba(255, 107, 0, 0.07)',
    color: '#fff',
    boxShadow: '0 0 0 2px rgba(255, 107, 0, 0.08)',
  },
  roleIcon: {
    color: '#ff6b00',
    fontSize: '20px',
    lineHeight: 1,
  },
  roleTitle: {
    fontSize: '13px',
    fontWeight: '700',
  },
  roleDescription: {
    color: '#858585',
    fontSize: '11px',
    lineHeight: 1.4,
  },
  selectedMark: {
    position: 'absolute',
    top: '10px',
    right: '11px',
    color: '#ff6b00',
    fontSize: '13px',
    fontWeight: '800',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: '#d2d2d2',
    fontSize: '13px',
    fontWeight: '600',
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
  helperText: {
    color: '#666',
    fontSize: '11px',
  },
  submitBtn: {
    width: '100%',
    minHeight: '48px',
    marginTop: '3px',
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
    animation: 'lancer-register-spin 0.65s linear infinite',
  },
  separator: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '27px 0 14px',
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
    margin: '0 0 14px',
    color: '#777',
    textAlign: 'center',
    fontSize: '12px',
    lineHeight: 1.6,
  },
  loginBtn: {
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
    marginTop: '23px',
    paddingTop: '18px',
    borderTop: '1px solid #242424',
    color: '#555',
    fontSize: '11px',
  },
};