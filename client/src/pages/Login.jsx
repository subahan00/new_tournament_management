  import React, { useState, useEffect } from 'react';
  import axios from 'axios';
  import { useNavigate } from 'react-router-dom';
  import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
  import { useAuth } from '../contexts/AuthContext';

  const Login = () => {
    const [credentials, setCredentials] = useState({
      username: '',
      password: ''
    });
    const { setUser } = useAuth();

    const [resetPasswordData, setResetPasswordData] = useState({
      username: '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showPassword, setShowPassword] = useState({
      login: false,
      oldPassword: false,
      newPassword: false,
      confirmPassword: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
      if (resetPasswordData.newPassword) {
        calculatePasswordStrength(resetPasswordData.newPassword);
      }
    }, [resetPasswordData.newPassword]);

    const calculatePasswordStrength = (password) => {
      let strength = 0;
      if (password.length >= 8) strength += 1;
      if (/[A-Z]/.test(password)) strength += 1;
      if (/[0-9]/.test(password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(password)) strength += 1;
      setPasswordStrength(strength);
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      if (showResetPassword) {
        setResetPasswordData(prev => ({ ...prev, [name]: value }));
      } else {
        setCredentials(prev => ({ ...prev, [name]: value }));
      }
    };

    const togglePasswordVisibility = (field) => {
      setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

 // In Login component
const { login } = useAuth(); // Instead of setUser

const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/login`,
        credentials
      );
      
      const { token, user } = res.data;
      login(token, user);
      
      // Redirect to intended location or dashboard
      const redirectTo = location.state?.from?.pathname || '/admin/dashboard';
      navigate(redirectTo, { replace: true });
       console.log('Login successful. Redirecting to:', redirectTo);
      console.log('Token:', token);
      console.log('User:', user);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

    const handleResetPassword = async (e) => {
      e.preventDefault();
      setError('');
      
      if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
        setError("New passwords don't match");
        return;
      }

      if (passwordStrength < 3) {
        setError("Password is too weak. Include uppercase, numbers, and special characters");
        return;
      }

      setIsLoading(true);
      try {
        await axios.post(` ${process.env.REACT_APP_BACKEND_URL}/api/auth/reset-password`, 
          {
            username: resetPasswordData.username, 
            oldPassword: resetPasswordData.oldPassword,
            newPassword: resetPasswordData.newPassword
          }
        );
        setSuccess('Password changed successfully');
        setResetPasswordData({
          username: '',
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          setSuccess('');
          setShowResetPassword(false);
        }, 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to reset password');
      } finally {
        setIsLoading(false);
      }
    };

    const getPasswordStrengthColor = () => {
      switch(passwordStrength) {
        case 0: return 'bg-gray-500';
        case 1: return 'bg-red-500';
        case 2: return 'bg-yellow-500';
        case 3: return 'bg-blue-500';
        case 4: return 'bg-green-500';
        default: return 'bg-gray-500';
      }
    };
  return (
      <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        {/* Background texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/subtle-carbon.png')] opacity-20"></div>
        
        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
          {/* Gold emblem/logo placeholder */}
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-500 shadow-lg shadow-yellow-500/20 flex items-center justify-center mb-4">
            <span className="text-black font-bold text-xl">⚜️</span>
          </div>
          <h2 className="mt-2 text-center text-3xl font-serif font-bold text-yellow-600 tracking-wider">
            ADMIN PORTAL
          </h2>
        </div>

        <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-900/90 backdrop-blur-sm border border-yellow-800/30 py-10 px-6 shadow-xl shadow-yellow-900/10 sm:rounded-lg sm:px-10">
            
            {!showResetPassword ? (
              <>
                <h2 className="text-center text-2xl font-serif font-medium text-yellow-500 mb-8 tracking-wider">
                  Sign In
                </h2>
                {error && (
                  <div className="mb-6 bg-red-900/40 border border-red-800/50 text-red-100 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-yellow-100/80 mb-1 tracking-wide">
                      Username
                    </label>
                    <div className="mt-1">
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        value={credentials.username}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 bg-gray-800/70 border border-gray-700/50 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-600/50 focus:border-yellow-600 text-yellow-100 tracking-wide"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-yellow-100/80 mb-1 tracking-wide">
                      Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword.login ? "text" : "password"}
                        required
                        value={credentials.password}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 bg-gray-800/70 border border-gray-700/50 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-600/50 focus:border-yellow-600 text-yellow-100 tracking-wide pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('login')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-yellow-600/70 hover:text-yellow-500"
                      >
                        {showPassword.login ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(true)}
                        className="font-medium text-yellow-600/80 hover:text-yellow-500 tracking-wide"
                      >
                        click here to reset password
                      </button>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 tracking-wider ${isLoading ? 'opacity-80' : ''}`}
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          SIGNING IN...
                        </span>
                      ) : 'SIGN IN'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setShowResetPassword(false)}
                    className="text-yellow-600/80 hover:text-yellow-500 mr-2"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
                  <h2 className="text-2xl font-serif font-medium text-yellow-500 tracking-wider">
                    Reset Password
                  </h2>
                </div>
                
                {error && (
                  <div className="mb-6 bg-red-900/40 border border-red-800/50 text-red-100 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-6 bg-green-900/40 border border-green-800/50 text-green-100 px-4 py-3 rounded-lg">
                    {success}
                  </div>
                )}
                <form className="space-y-6" onSubmit={handleResetPassword}>
                  <div>
                    <label htmlFor="reset-username" className="block text-sm font-medium text-gray-300">
                      Username
                    </label>
                    <div className="mt-1">
                      <input
                        id="reset-username"
                        name="username"
                        type="text"
                        required
                        value={resetPasswordData.username}
                        onChange={handleChange}
                        className="appearance-none block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-300">
                      Current Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="oldPassword"
                        name="oldPassword"
                        type={showPassword.oldPassword ? "text" : "password"}
                        required
                        value={resetPasswordData.oldPassword}
                        onChange={handleChange}
                        className="appearance-none block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('oldPassword')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-amber-400"
                      >
                        {showPassword.oldPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">
                      New Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword.newPassword ? "text" : "password"}
                        required
                        value={resetPasswordData.newPassword}
                        onChange={handleChange}
                        className="appearance-none block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('newPassword')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-amber-400"
                      >
                        {showPassword.newPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {resetPasswordData.newPassword && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getPasswordStrengthColor()}`} 
                            style={{ width: `${passwordStrength * 25}%` }}
                          ></div>
                        </div>
                        <p className="text-xs mt-1 text-gray-400">
                          Password strength: {['Very weak', 'Weak', 'Moderate', 'Strong', 'Very strong'][passwordStrength]}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                      Confirm New Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword.confirmPassword ? "text" : "password"}
                        required
                        value={resetPasswordData.confirmPassword}
                        onChange={handleChange}
                        className="appearance-none block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirmPassword')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-amber-400"
                      >
                        {showPassword.confirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Resetting...
                        </span>
                      ) : 'Reset Password'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  export default Login;
