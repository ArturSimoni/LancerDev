import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>LancerDev - Home</h1>
      <nav>
        <Link to="/login">Ir para Login</Link> | <Link to="/dashboard">Ir para Dashboard</Link>
      </nav>
    </div>
  );
}