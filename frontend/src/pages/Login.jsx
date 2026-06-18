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
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('@LancerDev:token', token);
      localStorage.setItem('@LancerDev:role', user.role);
      localStorage.setItem('@LancerDev:user', JSON.stringify(user));

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao realizar login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Acessar LancerDev</h2>
      <p style={styles.subtitle}>Entre para gerenciar seus projetos e propostas</p>
      
      {error && <div style={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>E-mail:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={styles.input}
            placeholder="seu@email.com"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Senha:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={styles.input}
            placeholder="Sua senha secreta"
          />
        </div>

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? 'Autenticando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#1e1e1e',
    maxWidth: '450px',
    margin: '80px auto',
    padding: '40px 30px',
    borderRadius: '8px',
    border: '1px solid #222',
    color: '#fff',
  },
  title: { 
    fontSize: '28px', 
    marginBottom: '5px', 
    textAlign: 'center',
    fontWeight: 'bold' 
  },
  subtitle: { 
    textAlign: 'center', 
    color: '#aaa', 
    fontSize: '14px', 
    marginBottom: '30px' 
  },
  inputGroup: { 
    marginBottom: '20px' 
  },
  label: { 
    display: 'block', 
    marginBottom: '8px', 
    fontSize: '14px', 
    fontWeight: '500' 
  },
  input: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#121212',
    border: '1px solid #333',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#ff6b00',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: '0.2s',
  },
  errorBox: { 
    backgroundColor: 'rgba(255, 51, 51, 0.1)', 
    color: '#ff3333', 
    border: '1px solid #ff3333', 
    padding: '12px', 
    borderRadius: '4px', 
    marginBottom: '25px', 
    fontSize: '14px', 
    textAlign: 'center' 
  },
};