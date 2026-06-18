import { createBrowserRouter } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cadastro from './pages/Cadastro';
import CriarProjeto from './pages/CriarProjeto';
import MeusAnuncios from './pages/MeusAnuncios';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/cadastro',
        element: <Cadastro />,
      },
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/criar-projeto',
        element: <CriarProjeto />,
      },
      {
        path: '/meus-anuncios',
        element: <MeusAnuncios />,
      },
    ],
  },
]);