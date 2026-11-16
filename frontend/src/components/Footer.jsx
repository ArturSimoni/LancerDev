import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <Link className="site-footer-brand" to="/">
          Lancer<span>Dev</span>
        </Link>
        <div className="site-footer-copy">
          <p>&copy; {new Date().getFullYear()} LancerDev. Todos os direitos reservados.</p>
          <p>Feito para freelancers e clientes de tecnologia.</p>
        </div>
      </div>
    </footer>
  );
}