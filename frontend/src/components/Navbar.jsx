import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  // Estado para forçar a atualização da navbar
  const [userState, setUserState] = useState({
    auth: !!localStorage.getItem('@LancerDev:token'),
    role: localStorage.getItem('@LancerDev:role'),
    name: JSON.parse(localStorage.getItem('@LancerDev:user') || 'null')?.name
  });

  // Atualiza o estado se algo mudar no localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setUserState({
        auth: !!localStorage.getItem('@LancerDev:token'),
        role: localStorage.getItem('@LancerDev:role'),
        name: JSON.parse(localStorage.getItem('@LancerDev:user') || 'null')?.name
      });
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  function handleLogout() {
    localStorage.clear();
    navigate('/');
    window.location.reload(); // Recarrega para limpar todos os estados da app
  }

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>Lancer<span style={{ color: '#ff6b00' }}>Dev</span></Link>
        
        <nav style={styles.nav}>
          <Link to="/" style={styles.link}>Início</Link>
          
          {/* Menu Freelancer */}
          {userState.auth && userState.role === 'freelancer' && (
            <>
              <Link to="/dashboard" style={styles.link}>Painel Freelancer</Link>
              <Link to="/projetos" style={styles.link}>Buscar Projetos</Link>
              <Link to="/propostas" style={styles.link}>Minhas Propostas</Link>
            </>
          )}

          {/* Menu Cliente */}
          {userState.auth && userState.role === 'client' && (
            <>
              <Link to="/dashboard" style={styles.link}>Painel Cliente</Link>
              <Link to="/criar-projeto" style={styles.link}>Publicar Vaga</Link>
              <Link to="/meus-anuncios" style={styles.link}>Meus Anúncios</Link>
            </>
          )}
        </nav>

        <div style={styles.authArea}>
          {userState.auth ? (
            <div style={styles.userMenu}>
              <span style={styles.username}>Olá, {userState.name}</span>
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
  header: { backgroundColor: '#1e1e1e', borderBottom: '2px solid #ff6b00', padding: '15px 0', position: 'sticky', top: 0, zIndex: 1000 },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: '24px', fontWeight: 'bold', color: '#fff', textDecoration: 'none' },
  nav: { display: 'flex', gap: '20px' },
  link: { color: '#fff', textDecoration: 'none', fontWeight: '500' },
  authArea: { display: 'flex', gap: '15px', alignItems: 'center' },
  loginBtn: { color: '#fff', textDecoration: 'none', fontWeight: '500' },
  registerBtn: { backgroundColor: '#ff6b00', color: '#fff', padding: '8px 16px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' },
  userMenu: { display: 'flex', gap: '15px', alignItems: 'center' },
  username: { color: '#aaa', fontSize: '14px' },
  logoutBtn: { backgroundColor: 'transparent', color: '#ff3333', border: '1px solid #ff3333', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' }
};