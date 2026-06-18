import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Altere a rota '/auth/login' para o endpoint exato da sua API Express
      const response = await api.post('/auth/login', { email, password });
      
      const { token, user } = response.data; // Supondo que seu back retorne { token, user: { role, name } }

      // Salva os dados essenciais no navegador
      localStorage.setItem('@LancerDev:token', token);
      localStorage.setItem('@LancerDev:role', user.role);
      localStorage.setItem('@LancerDev:user', JSON.stringify(user));

      // Redirecionamento estratégico baseado na Role
      if (user.role === 'freelancer') {
        navigate('/dashboard'); // Ou /dashboard/freelancer se preferir separar depois
      } else if (user.role === 'client') {
        navigate('/dashboard'); // Ou /dashboard/client
      } else {
        navigate('/');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao realizar login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Acessar LancerDev</h1>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block' }}>E-mail:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block' }}>Senha:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}