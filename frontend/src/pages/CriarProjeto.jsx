import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CriarProjeto() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/projects', {
        title,
        description,
        budget: Number(budget),
        deliveryTime 
      });

      navigate('/meus-anuncios');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao publicar projeto.');
    } finally {
      setLoading(false);
    }
  }

  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Publicar Nova Vaga</h2>
      <p style={styles.subtitle}>Preencha os detalhes para encontrar o desenvolvedor ideal</p>

      {error && <div style={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Título do Projeto:</label>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
            style={styles.input}
            placeholder="Ex: Desenvolvimento de E-commerce com React"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Descrição das Necessidades:</label>
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            required 
            style={{ ...styles.input, height: '120px', resize: 'vertical' }}
            placeholder="Descreva o que o profissional precisará fazer..."
          />
        </div>

        {/* Linha lado a lado para Orçamento e Prazo */}
        <div style={styles.row}>
          <div style={{ ...styles.inputGroup, flex: 1 }}>
            <label style={styles.label}>Orçamento (R$):</label>
            <input 
              type="number" 
              value={budget} 
              onChange={e => setBudget(e.target.value)} 
              required 
              style={styles.input}
              placeholder="Ex: 2500"
            />
          </div>

          {/* 3. Campo de Calendário Integrado */}
          <div style={{ ...styles.inputGroup, flex: 1 }}>
            <label style={styles.label}>Prazo Limite de Entrega:</label>
            <input 
              type="date" 
              value={deliveryTime} 
              onChange={e => setDeliveryTime(e.target.value)} 
              min={hoje} // 🔒 Impede o cliente de selecionar uma data no passado
              required 
              style={styles.input}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? 'Publicando...' : 'Publicar Vaga no LancerDev'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: { backgroundColor: '#1e1e1e', maxWidth: '650px', margin: '5px auto', padding: '35px 30px', borderRadius: '8px', border: '1px solid #222', color: '#fff' },
  title: { fontSize: '26px', marginBottom: '5px', fontWeight: 'bold' },
  subtitle: { color: '#aaa', fontSize: '14px', marginBottom: '25px' },
  inputGroup: { marginBottom: '20px' },
  row: { display: 'flex', gap: '20px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' },
  input: { width: '100%', padding: '12px', backgroundColor: '#121212', border: '1px solid #333', borderRadius: '4px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '14px', backgroundColor: '#ff6b00', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px' },
  errorBox: { backgroundColor: 'rgba(255, 51, 51, 0.1)', color: '#ff3333', border: '1px solid #ff3333', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }
};