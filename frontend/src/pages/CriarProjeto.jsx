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

    if (Number(budget) <= 0) {
      setError('Informe um orçamento maior que zero.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/projects', {
        title: title.trim(),
        description: description.trim(),
        budget: Number(budget),
        deliveryTime
      });

      navigate('/meus-anuncios');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Erro ao publicar projeto.'
      );
    } finally {
      setLoading(false);
    }
  }

  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Publicar nova vaga</h1>
          <p style={styles.subtitle}>
            Descreva seu projeto e encontre profissionais qualificados para executá-lo.
          </p>
        </div>

        <div style={styles.headerBadge}>
          Nova oportunidade
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.formCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Informações do projeto</h2>
              <p style={styles.sectionDescription}>
                Apresente o projeto com o máximo de clareza possível.
              </p>
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Título do projeto
              </label>

              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                maxLength={100}
                style={styles.input}
                placeholder="Ex: Desenvolvimento de e-commerce com React"
              />

              <span style={styles.helperText}>
                Escolha um título objetivo e fácil de entender.
              </span>
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label}>
                  Descrição do projeto
                </label>

                <span style={styles.counter}>
                  {description.length}/2000
                </span>
              </div>

              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                maxLength={2000}
                style={styles.textarea}
                placeholder="Explique o que precisa ser desenvolvido, quais são os objetivos do projeto e quais resultados espera receber."
              />

              <span style={styles.helperText}>
                Quanto mais detalhes você fornecer, mais fácil será para o freelancer entender a necessidade.
              </span>
            </div>

            <div style={styles.divider} />

            <div style={styles.sectionHeaderSmall}>
              <h2 style={styles.sectionTitle}>
                Orçamento e prazo
              </h2>

              <p style={styles.sectionDescription}>
                Defina as principais condições da contratação.
              </p>
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>
                  Orçamento total
                </label>

                <div style={styles.moneyWrapper}>
                  <span style={styles.moneyPrefix}>
                    R$
                  </span>

                  <input
                    type="number"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    required
                    min="1"
                    step="0.01"
                    style={styles.moneyInput}
                    placeholder="2500,00"
                  />
                </div>

                <span style={styles.helperText}>
                  Valor máximo que pretende investir no projeto.
                </span>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Prazo de entrega
                </label>

                <input
                  type="date"
                  value={deliveryTime}
                  onChange={e => setDeliveryTime(e.target.value)}
                  min={hoje}
                  required
                  style={styles.input}
                />

                <span style={styles.helperText}>
                  Data limite para conclusão do projeto.
                </span>
              </div>
            </div>

            <div style={styles.summary}>
              <div style={styles.summaryIcon}>
                i
              </div>

              <div>
                <strong style={styles.summaryTitle}>
                  Antes de publicar
                </strong>

                <p style={styles.summaryText}>
                  Sua vaga ficará disponível para freelancers enviarem propostas.
                  Você poderá analisar os candidatos, consultar seus perfis e escolher uma proposta.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Publicando projeto...' : 'Publicar vaga'}
            </button>
          </form>
        </div>

        <aside style={styles.sideCard}>
          <h3 style={styles.sideTitle}>
            Como funciona
          </h3>

          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>

            <div>
              <strong style={styles.stepTitle}>
                Publique sua vaga
              </strong>

              <p style={styles.stepText}>
                Informe o que precisa ser desenvolvido e defina orçamento e prazo.
              </p>
            </div>
          </div>

          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>

            <div>
              <strong style={styles.stepTitle}>
                Receba propostas
              </strong>

              <p style={styles.stepText}>
                Freelancers poderão analisar sua vaga e enviar propostas.
              </p>
            </div>
          </div>

          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>

            <div>
              <strong style={styles.stepTitle}>
                Analise os candidatos
              </strong>

              <p style={styles.stepText}>
                Consulte perfil, experiência e avaliações antes de escolher.
              </p>
            </div>
          </div>

          <div style={styles.step}>
            <div style={styles.stepNumber}>4</div>

            <div>
              <strong style={styles.stepTitle}>
                Feche o projeto
              </strong>

              <p style={styles.stepText}>
                Após escolher uma proposta, o projeto poderá ser iniciado.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: '100%',
    maxWidth: '1180px',
    margin: '0 auto',
    padding: '30px 24px 50px',
    boxSizing: 'border-box',
    color: '#fff'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: '25px'
  },

  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: '#fff'
  },

  subtitle: {
    margin: '8px 0 0',
    color: '#999',
    fontSize: '14px',
    lineHeight: '1.5'
  },

  headerBadge: {
    padding: '8px 14px',
    borderRadius: '20px',
    backgroundColor: '#2a180c',
    border: '1px solid #4a270f',
    color: '#ff6b00',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },

  content: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 300px',
    gap: '24px',
    alignItems: 'start'
  },

  formCard: {
    backgroundColor: '#1b1b1b',
    border: '1px solid #292929',
    borderRadius: '10px',
    padding: '30px',
    boxSizing: 'border-box'
  },

  sectionHeader: {
    marginBottom: '28px'
  },

  sectionHeaderSmall: {
    marginBottom: '20px'
  },

  sectionTitle: {
    margin: 0,
    fontSize: '17px',
    color: '#fff',
    fontWeight: '600'
  },

  sectionDescription: {
    margin: '6px 0 0',
    color: '#777',
    fontSize: '13px'
  },

  inputGroup: {
    marginBottom: '24px'
  },

  field: {
    flex: 1,
    minWidth: 0
  },

  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px'
  },

  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#ddd',
    fontSize: '13px',
    fontWeight: '600'
  },

  counter: {
    color: '#666',
    fontSize: '11px'
  },

  input: {
    width: '100%',
    height: '46px',
    padding: '0 13px',
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },

  textarea: {
    width: '100%',
    minHeight: '150px',
    padding: '13px',
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    lineHeight: '1.6',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },

  helperText: {
    display: 'block',
    marginTop: '6px',
    color: '#666',
    fontSize: '11px',
    lineHeight: '1.4'
  },

  divider: {
    height: '1px',
    backgroundColor: '#292929',
    margin: '28px 0'
  },

  row: {
    display: 'flex',
    gap: '20px',
    marginBottom: '25px'
  },

  moneyWrapper: {
    display: 'flex',
    width: '100%',
    height: '46px'
  },

  moneyPrefix: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 13px',
    backgroundColor: '#222',
    border: '1px solid #333',
    borderRight: 'none',
    borderRadius: '6px 0 0 6px',
    color: '#999',
    fontSize: '13px'
  },

  moneyInput: {
    flex: 1,
    minWidth: 0,
    padding: '0 13px',
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: '0 6px 6px 0',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },

  summary: {
    display: 'flex',
    gap: '12px',
    padding: '15px',
    marginBottom: '22px',
    backgroundColor: '#151515',
    border: '1px solid #292929',
    borderRadius: '7px'
  },

  summaryIcon: {
    width: '24px',
    height: '24px',
    minWidth: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#ff6b00',
    color: '#111',
    fontSize: '13px',
    fontWeight: '700'
  },

  summaryTitle: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '13px',
    color: '#ddd'
  },

  summaryText: {
    margin: 0,
    color: '#777',
    fontSize: '12px',
    lineHeight: '1.5'
  },

  submitBtn: {
    width: '100%',
    height: '48px',
    backgroundColor: '#ff6b00',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '14px'
  },

  sideCard: {
    backgroundColor: '#171717',
    border: '1px solid #292929',
    borderRadius: '10px',
    padding: '24px'
  },

  sideTitle: {
    margin: '0 0 24px',
    color: '#fff',
    fontSize: '16px'
  },

  step: {
    display: 'flex',
    gap: '12px',
    marginBottom: '22px'
  },

  stepNumber: {
    width: '26px',
    height: '26px',
    minWidth: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#ff6b00',
    color: '#111',
    fontSize: '12px',
    fontWeight: '700'
  },

  stepTitle: {
    display: 'block',
    marginBottom: '5px',
    color: '#ddd',
    fontSize: '13px'
  },

  stepText: {
    margin: 0,
    color: '#777',
    fontSize: '12px',
    lineHeight: '1.5'
  },

  errorBox: {
    backgroundColor: 'rgba(255, 51, 51, 0.08)',
    color: '#ff5555',
    border: '1px solid rgba(255, 51, 51, 0.35)',
    padding: '12px 14px',
    borderRadius: '6px',
    marginBottom: '22px',
    fontSize: '13px'
  }
};