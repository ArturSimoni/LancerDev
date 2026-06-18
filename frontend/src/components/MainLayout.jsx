import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function MainLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '40px 20px' }}>
        <Outlet /> {/* Aqui o React Router vai renderizar a página correspondente à URL */}
      </main>
      <Footer />
    </div>
  );
}