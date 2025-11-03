import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAdmin, loading } = useAuth();

  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  
  return children;
};

export default ProtectedRoute;
