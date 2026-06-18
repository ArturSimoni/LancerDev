import { Navigate,} from 'react-router-dom';

const ProtectedRoute = ({ children, isPrivate }) => {
    const token = localStorage.getItem('@LancerDev:token');
    
    // Usamos um condicional simples
    if (isPrivate && !token) {
        return <Navigate to="/login" replace />;
    }
    if (!isPrivate && token) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

export default ProtectedRoute;