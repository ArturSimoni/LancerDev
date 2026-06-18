import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  
  // Pegamos a role atualizada do localStorage
  const role = localStorage.getItem('@LancerDev:role');
  const user = localStorage.getItem('@LancerDev:user') ? JSON.parse(localStorage.getItem('@LancerDev:user')) : null;

  function handleLogout() {
    localStorage.clear();
    navigate('/');
  }

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          Lancer<span style={{ color: 'var(--color-primary)' }}>Dev</span>
        </Link>

        {/* Links de Navegação */}
        <nav style={styles.nav}>
          <Link to="/" style={styles.link}>Início</Link>

          {/* Menus específicos para Freelancer */}
          {role === 'freelancer' && (
            <>
              <Link to="/dashboard" style={styles.link}>Painel Free</Link>
              <Link to="/projetos" style={styles.link}>Buscar Projetos</Link>
              <Link to="/propostas" style={styles.link}>Minhas Propostas</Link>
            </>
          )}

          {/* Menus específicos para Cliente */}
          {role === 'client' && (
            <>
              <Link to="/dashboard" style={styles.link}>Painel Cliente</Link>
              <Link to="/criar-projeto" style={styles.link}>Publicar Vaga</Link>
              <Link to="/meus-projetos" style={styles.link}>Meus Anúncios</Link>
            </>
          )}
        </nav>

        {/* Área de Autenticação / Perfil */}
        <div style={styles.authArea}>
          {role ? (
            <div style={styles.userMenu}>
              <span style={styles.username}>Olá, {user?.name || 'Usuário'}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>Sair</button>
            </div>
          ) : (
            <>
              <Link to="/login" style={styles.loginBtn}>Entrar</Link>
              <Link to="/cadastro" style={styles.registerBtn}>Cadastrar</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    backgroundColor: 'var(--color-surface)',
    borderBottom: '2px solid var(--color-primary)',
    padding: '15px 0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#fff',
    textDecoration: 'none',
  },
  nav: {
    display: 'flex',
    gap: '20px',
  },
  link: {
    color: '#fff',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.2s',
  },
  authArea: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  loginBtn: {
    color: '#fff',
    textDecoration: 'none',
    fontWeight: '500',
  },
  registerBtn: {
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  userMenu: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  username: {
    color: 'var(--color-text-muted)',
    fontSize: '14px',
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    color: '#ff3333',
    border: '1px solid #ff3333',
    padding: '5px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
  }
};