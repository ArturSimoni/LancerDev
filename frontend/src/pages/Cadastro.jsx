import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Cadastro() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('freelancer'); // Default inicial
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Ajuste o endpoint conforme a rota de registro da sua API Express
      await api.post('/auth/register', { name, email, password, role });
      
      // Cadastro feito com sucesso? Envia direto para o Login
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Criar uma Conta</h2>
      <p style={styles.subtitle}>Seja bem-vindo ao ecossistema LancerDev</p>

      {error && <div style={styles.errorBox}>{error}</div>}

      <form onSubmit={handleRegister}>
        {/* Seletor de Role (Estilizado como botões de alternância) */}
        <div style={styles.roleSelectionContainer}>
          <button
            type="button"
            onClick={() => setRole('freelancer')}
            style={{
              ...styles.roleButton,
              ...(role === 'freelancer' ? styles.roleButtonActive : {}),
            }}
          >
            Quero ser Freelancer
          </button>
          <button
            type="button"
            onClick={() => setRole('client')}
            style={{
              ...styles.roleButton,
              ...(role === 'client' ? styles.roleButtonActive : {}),
            }}
          >
            Quero Contratar
          </button>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Nome Completo:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
            placeholder="Ex: João Silva"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>E-mail:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="seuemail@exemplo.com"
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
            placeholder="No mínimo 6 caracteres"
          />
        </div>

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? 'Cadastrando...' : 'Concluir Cadastro'}
        </button>
      </form>

      <p style={styles.footerText}>
        Já tem uma conta? <Link to="/login" style={styles.link}>Faça Login</Link>
      </p>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'var(--color-surface)',
    maxWidth: '450px',
    margin: '40px auto',
    padding: '30px',
    borderRadius: '8px',
    border: '1px solid #222',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  },
  title: {
    textAlign: 'center',
    fontSize: '24px',
    marginBottom: '5px',
  },
  subtitle: {
    textAlign: 'center',
    color: 'var(--color-text-muted)',
    fontSize: '14px',
    marginBottom: '25px',
  },
  roleSelectionContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  roleButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#121212',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  roleButtonActive: {
    borderColor: 'var(--color-primary)',
    color: 'var(--color-primary)',
    backgroundColor: 'rgba(255, 102, 0, 0.05)',
  },
  inputGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#121212',
    border: '1px solid #333',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.2s',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 51, 51, 0.1)',
    color: '#ff3333',
    border: '1px solid #ff3333',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
    textAlign: 'center',
  },
  footerText: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px',
    color: 'var(--color-text-muted)',
  },
  link: {
    color: 'var(--color-primary)',
    textDecoration: 'none',
    fontWeight: '500',
  },
};