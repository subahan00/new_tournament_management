import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = () => {
      console.log('AuthContext: Starting authentication initialization');
      
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');
        
        console.log('AuthContext: Retrieved from localStorage', {
          hasToken: !!storedToken,
          hasUser: !!storedUser,
          storedUser: storedUser,
          isValidUser: storedUser && storedUser !== "undefined"
        });

        // Fix: Check if storedUser exists before parsing
        if (storedUser && storedUser !== "undefined") {
          const parsedUser = JSON.parse(storedUser);
          console.log('AuthContext: Parsed user:', parsedUser);
          setUser(parsedUser);
        }

        if (storedToken) {
          console.log('AuthContext: Setting token and axios header');
          setToken(storedToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
          console.log('AuthContext: No token found');
        }
      } catch (error) {
        console.error("AuthContext: Failed to initialize auth state:", error);
        // Clear invalid storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      } finally {
        console.log('AuthContext: Setting loading to false');
        setLoading(false);
      }
    };

    // Add a small delay to ensure localStorage is ready (Vercel fix)
    const timer = setTimeout(initializeAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  const login = (newToken, userData) => {
    console.log('AuthContext: Login called with:', { 
      hasToken: !!newToken, 
      userData: userData 
    });
    
    try {
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      console.log('AuthContext: Login successful');
      return true;
    } catch (error) {
      console.error("AuthContext: Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    console.log('AuthContext: Logout called');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAdmin = user?.role === 'admin';
  
  console.log('AuthContext: Current state:', {
    hasUser: !!user,
    isAdmin,
    loading,
    userRole: user?.role
  });

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAdmin,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
