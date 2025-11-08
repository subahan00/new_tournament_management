import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to check if token is expired
  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Helper to get storage based on remember me preference
  const getStorage = () => {
    // Check localStorage first (remember me = true)
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    return rememberMe ? localStorage : sessionStorage;
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Check both storages (localStorage for remember me, sessionStorage for regular login)
        let storedToken = localStorage.getItem('authToken');
        let storedUser = localStorage.getItem('user');
        let storage = localStorage;

        // If not in localStorage, check sessionStorage
        if (!storedToken) {
          storedToken = sessionStorage.getItem('authToken');
          storedUser = sessionStorage.getItem('user');
          storage = sessionStorage;
        }

        // Check if token exists and is valid
        if (storedToken && !isTokenExpired(storedToken)) {
          if (storedUser && storedUser !== "undefined") {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          } else {
            // Clear invalid user data
            storage.removeItem('authToken');
            storage.removeItem('user');
            setUser(null);
            setToken(null);
          }
        } else {
          // Token expired or doesn't exist, clear everything
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('rememberMe');
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error("Failed to initialize auth state:", error);
        // Clear all storage on error
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Modified login function with rememberMe parameter
  const login = (newToken, userData, rememberMe = false) => {
    try {
      // Validate token before storing
      if (isTokenExpired(newToken)) {
        console.error("Attempting to login with expired token");
        return false;
      }

      // Choose storage based on rememberMe
      const storage = rememberMe ? localStorage : sessionStorage;
      
      // Clear the other storage to avoid conflicts
      if (rememberMe) {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
      }

      // Store credentials in chosen storage
      storage.setItem('authToken', newToken);
      storage.setItem('user', JSON.stringify(userData));
      
      // Store remember me preference in localStorage (always persistent)
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    // Clear both storages
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAdmin = user?.role === 'admin';

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