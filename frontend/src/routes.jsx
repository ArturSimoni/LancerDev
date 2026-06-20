import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import CriarProjeto from "./pages/CriarProjeto";
import MeusAnuncios from "./pages/MeusAnuncios";
import BuscarProjetos from "./pages/BuscarProjetos";
import MinhasPropostas from "./pages/MinhasPropostas";
import Chat from "./pages/Chat";
import DetalhesProjeto from "./pages/DetalhesProjeto";
import VerPropostas from "./pages/VerPropostas";

const ProtectedRoute = ({ children, isPrivate }) => {
  const token = localStorage.getItem('@LancerDev:token');
  if (isPrivate && !token) return <Navigate to="/login" replace />;
  if (!isPrivate && token) return <Navigate to="/dashboard" replace />;
  return children;
};

const Layout = () => (
  <>
    <Navbar />
    <main><Outlet /></main>
  </>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "login",         element: <ProtectedRoute isPrivate={false}><Login /></ProtectedRoute> },
      { path: "cadastro",      element: <ProtectedRoute isPrivate={false}><Cadastro /></ProtectedRoute> },
      { path: "dashboard",     element: <ProtectedRoute isPrivate={true}><Dashboard /></ProtectedRoute> },
      { path: "criar-projeto", element: <ProtectedRoute isPrivate={true}><CriarProjeto /></ProtectedRoute> },
      { path: "meus-anuncios", element: <ProtectedRoute isPrivate={true}><MeusAnuncios /></ProtectedRoute> },
      { path: "projetos",      element: <ProtectedRoute isPrivate={true}><BuscarProjetos /></ProtectedRoute> },
      { path: "propostas",     element: <ProtectedRoute isPrivate={true}><MinhasPropostas /></ProtectedRoute> },
      { path: "chat",          element: <ProtectedRoute isPrivate={true}><Chat /></ProtectedRoute> },
      { path: "projeto/:id",   element: <ProtectedRoute isPrivate={true}><DetalhesProjeto /></ProtectedRoute> },
      { path: "projetos/:projectId/propostas", element: <ProtectedRoute isPrivate={true}><VerPropostas /></ProtectedRoute> },

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);