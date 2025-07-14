import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAdmin, loading } = useAuth();

  // Debug logging for Vercel
  console.log('ProtectedRoute Debug:', {
    loading,
    user: user ? 'User exists' : 'No user',
    isAdmin,
    adminOnly,
    localStorage_token: localStorage.getItem('authToken') ? 'Token exists' : 'No token',
    localStorage_user: localStorage.getItem('user') ? 'User data exists' : 'No user data'
  });

  // Show loading spinner/component while authentication is being initialized
  if (loading) {
    console.log('ProtectedRoute: Showing loading state');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>Loading...</div>
        <div style={{ fontSize: '12px', marginTop: '10px' }}>
          Initializing authentication...
        </div>
      </div>
    );
  }

  // If no user is authenticated, redirect to login
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If admin-only route but user is not admin, redirect to home
  if (adminOnly && !isAdmin) {
    console.log('ProtectedRoute: User is not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute: All checks passed, rendering protected component');
  // If all checks pass, render the protected component
  return children;
};

export default ProtectedRoute;
