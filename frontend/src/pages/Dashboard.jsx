import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Recupera as informações salvas no momento do login
  const role = localStorage.getItem('@LancerDev:role');
  const user = JSON.stringify(localStorage.getItem('@LancerDev:user'));

  function handleLogout() {
    localStorage.clear(); // Limpa token, role, etc.
    navigate('/');
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Painel de Controle</h1>
      <p>Bem-vindo ao LancerDev!</p>
      
      <div style={{ background: '#f0f0f0', padding: '15px', margin: '20px 0', borderRadius: '5px' }}>
        <h3>Seu perfil atual é de: <strong style={{ color: 'blue' }}>{role?.toUpperCase()}</strong></h3>
      </div>

      {/* Renderização Condicional baseada na Role */}
      {role === 'freelancer' && (
        <div>
          <h2>🛠️ Área do Freelancer</h2>
          <ul>
            <li>Ver propostas enviadas</li>
            <li>Buscar projetos disponíveis</li>
            <li>Configurar portfólio</li>
          </ul>
        </div>
      )}

      {role === 'client' && (
        <div>
          <h2>💼 Área do Cliente</h2>
          <ul>
            <li>Criar novo anúncio de projeto</li>
            <li>Gerenciar freelancers contratados</li>
            <li>Visualizar propostas recebidas</li>
          </ul>
        </div>
      )}

      <button onClick={handleLogout} style={{ marginTop: '20px', padding: '8px 16px', background: 'red', color: 'white', border: 'none', cursor: 'pointer' }}>
        Sair da Conta
      </button>
    </div>
  );
}