export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <p>&copy; {new Date().getFullYear()} LancerDev. Todos os direitos reservados.</p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
          Plataforma desenvolvida para Freelancers & Clientes de Software.
        </p>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: '#0a0a0a',
    padding: '20px 0',
    marginTop: 'auto', // Faz o footer grudar embaixo se a página tiver pouco conteúdo
    borderTop: '1px solid #222',
    textAlign: 'center',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  }
};