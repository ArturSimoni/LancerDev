import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const freelancerLinks = [
  { to: '/dashboard',  label: 'Painel' },
  { to: '/projetos',   label: 'Buscar projetos' },
  { to: '/propostas',  label: 'Minhas propostas' },
];

const clientLinks = [
  { to: '/dashboard',     label: 'Painel' },
  { to: '/criar-projeto', label: 'Publicar vaga' },
  { to: '/meus-anuncios', label: 'Meus anúncios' },
];

function getAuthState() {
  return {
    auth: !!localStorage.getItem('@LancerDev:token'),
    role: localStorage.getItem('@LancerDev:role'),
    user: JSON.parse(localStorage.getItem('@LancerDev:user') || 'null'),
  };
}

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [state, setState]     = useState(getAuthState);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sync = () => setState(getAuthState());
    window.addEventListener('authChange', sync);
    return () => window.removeEventListener('authChange', sync);
  }, []);

  // Fecha menu mobile ao navegar
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  function handleLogout() {
    localStorage.clear();
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  }

  const links = state.role === 'freelancer' ? freelancerLinks
              : state.role === 'client'     ? clientLinks
              : [];

  const isActive = (path) => location.pathname === path;

  return (
    <header style={s.header}>
      <div style={s.container}>

        {/* Logo */}
        <Link to="/" style={s.logo}>
          Lancer<span style={s.logoAccent}>Dev</span>
        </Link>

        {/* Nav desktop */}
        <nav style={s.nav}>
          <Link to="/" style={isActive('/') ? s.linkActive : s.link}>Início</Link>
          {state.auth && links.map(({ to, label }) => (
            <Link key={to} to={to} style={isActive(to) ? s.linkActive : s.link}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth area desktop */}
        <div style={s.authArea}>
          {state.auth ? (
            <div style={s.userMenu}>
              <div style={s.avatar}>
                {state.user?.name?.charAt(0).toUpperCase()}
              </div>
              <span style={s.username}>{state.user?.name?.split(' ')[0]}</span>
              <div style={s.divider} />
              <button onClick={handleLogout} style={s.logoutBtn}
                onMouseEnter={e => e.target.style.color = '#ff6b00'}
                onMouseLeave={e => e.target.style.color = '#666'}
              >
                Sair
              </button>
            </div>
          ) : (
            <div style={s.authButtons}>
              <Link to="/login"    style={s.loginBtn}>Entrar</Link>
              <Link to="/cadastro" style={s.registerBtn}
                onMouseEnter={e => e.target.style.backgroundColor = '#e05e00'}
                onMouseLeave={e => e.target.style.backgroundColor = '#ff6b00'}
              >
                Criar conta
              </Link>
            </div>
          )}
        </div>

        {/* Hamburguer mobile */}
        <button
          style={s.hamburger}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
        >
          <span style={{ ...s.bar, transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
          <span style={{ ...s.bar, opacity: menuOpen ? 0 : 1 }} />
          <span style={{ ...s.bar, transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
        </button>
      </div>

      {/* Menu mobile dropdown */}
      {menuOpen && (
        <div style={s.mobileMenu}>
          <Link to="/" style={s.mobileLink}>Início</Link>
          {state.auth && links.map(({ to, label }) => (
            <Link key={to} to={to} style={s.mobileLink}>{label}</Link>
          ))}
          <div style={s.mobileDivider} />
          {state.auth ? (
            <button onClick={handleLogout} style={s.mobileLogout}>Sair</button>
          ) : (
            <>
              <Link to="/login"    style={s.mobileLink}>Entrar</Link>
              <Link to="/cadastro" style={{ ...s.mobileLink, color: '#ff6b00', fontWeight: '600' }}>Criar conta</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

const s = {
  header: {
    backgroundColor: '#0d0d0d',
    borderBottom: '1px solid #1e1e1e',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 0 0 #ff6b0022',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
  },

  // Logo
  logo: { fontSize: '20px', fontWeight: '700', color: '#fff', textDecoration: 'none', flexShrink: 0, letterSpacing: '-0.01em' },
  logoAccent: { color: '#ff6b00' },

  // Nav
  nav: { display: 'flex', gap: '4px', alignItems: 'center', flex: 1 },
  link: {
    color: '#888', textDecoration: 'none', fontSize: '13px', fontWeight: '500',
    padding: '6px 10px', borderRadius: '6px', transition: 'color 0.15s',
  },
  linkActive: {
    color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: '600',
    padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1a1a1a',
  },

  // Auth area
  authArea: { display: 'flex', alignItems: 'center', flexShrink: 0 },
  authButtons: { display: 'flex', gap: '8px', alignItems: 'center' },
  loginBtn: { color: '#aaa', textDecoration: 'none', fontSize: '13px', fontWeight: '500', padding: '6px 12px' },
  registerBtn: {
    backgroundColor: '#ff6b00', color: '#000', padding: '7px 16px',
    borderRadius: '6px', textDecoration: 'none', fontSize: '13px',
    fontWeight: '700', transition: 'background-color 0.15s', display: 'inline-block',
  },

  // User menu
  userMenu: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '30px', height: '30px', borderRadius: '50%',
    backgroundColor: '#ff6b00', color: '#000',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '700', flexShrink: 0,
  },
  username: { color: '#ccc', fontSize: '13px', fontWeight: '500' },
  divider: { width: '1px', height: '16px', backgroundColor: '#2a2a2a' },
  logoutBtn: {
    background: 'none', border: 'none', color: '#666',
    fontSize: '13px', cursor: 'pointer', padding: '4px 0',
    transition: 'color 0.15s',
  },

  // Hamburger
  hamburger: {
    display: 'none', flexDirection: 'column', gap: '4px',
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '4px',
    '@media(maxWidth:768px)': { display: 'flex' },
  },
  bar: {
    width: '20px', height: '2px', backgroundColor: '#fff',
    display: 'block', borderRadius: '2px',
    transition: 'transform 0.2s, opacity 0.2s',
  },

  // Mobile menu
  mobileMenu: {
    backgroundColor: '#0d0d0d', borderTop: '1px solid #1e1e1e',
    padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: '2px',
  },
  mobileLink: {
    color: '#aaa', textDecoration: 'none', fontSize: '15px',
    padding: '12px 0', borderBottom: '1px solid #141414', display: 'block',
  },
  mobileDivider: { height: '1px', backgroundColor: '#1e1e1e', margin: '8px 0' },
  mobileLogout: {
    background: 'none', border: 'none', color: '#666',
    fontSize: '15px', cursor: 'pointer', padding: '12px 0', textAlign: 'left',
  },
};
