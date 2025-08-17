import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useState } from 'react';
const AdminDashboard = () => {
  const { user } = useAuth();
  // State for the new announcement form
  const [announcement, setAnnouncement] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  // Get personalized greeting
  const getGreeting = () => {
    if (user?.username) {
      return `Welcome back, ${user.username}!`;
    }
    return 'Admin Dashboard';
  };
  const showWarning = user?.username && user.username.toLowerCase() !== 'amer';
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!announcement.trim()) {
      setStatus({ message: 'Announcement text cannot be empty.', type: 'error' });
      return;
    }
    setIsLoading(true);
    setStatus({ message: '', type: '' });

    try {
      // In a real app, this URL should be stored in a .env file
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

      // Send the announcement text to the backend API
      const response = await axios.post(`${backendUrl}/api/announcements`, {
        text: announcement
      });

      setStatus({ message: response.data.msg, type: 'success' });
      setAnnouncement(''); // Clear the textarea on success

      // Hide success message after 3 seconds
      setTimeout(() => setStatus({ message: '', type: '' }), 3000);

    } catch (error) {
      console.error("Failed to post announcement:", error);
      const errorMsg = error.response?.data?.msg || 'An unexpected error occurred.';
      setStatus({ message: errorMsg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-900 text-gold-100 flex">
      {/* Side Dashboard */}
      <div className="w-64 bg-gray-800/80 border-r border-gold-700/30 p-4 hidden md:block">
        <div className="mb-8 border-b border-gold-500/30 pb-4">
          <h2 className="text-xl font-bold text-gold-400">Navigation</h2>
        </div>

        <nav className="space-y-2">
          <div>
            <h3 className="text-gold-500 uppercase text-xs font-semibold tracking-wider mb-2">Main</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/admin/dashboard" className="block px-3 py-2 rounded bg-gold-900/20 text-gold-200 hover:bg-gold-800/30">
                  Dashboard Overview
                </Link>
              </li>
              <li>
                <Link to="/" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Home
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gold-500 uppercase text-xs font-semibold tracking-wider mb-2 mt-4">Competitions</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/competitions" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  View Competitions
                </Link>
              </li>
              <li>
                <Link to="/admin/manage-competitions" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Manage Competitions
                </Link>
              </li>
              <li>
                <Link to="/admin/create-competition" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Create Competition
                </Link>
              </li>
              <li>
                <Link to="/admin/update-competition" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Update Competition
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gold-500 uppercase text-xs font-semibold tracking-wider mb-2 mt-4">Teams & Players</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/admin/manage-players" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Manage Players
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gold-500 uppercase text-xs font-semibold tracking-wider mb-2 mt-4">Fixtures & Results</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/fixtures" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  View Fixtures
                </Link>
              </li>
              <li>
                <Link to="/admin/create-fixture" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Create Fixture
                </Link>
              </li>
              <li>
                <Link to="/admin/manage-fixtures" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Manage Fixtures
                </Link>
              </li>
              <li>
                <Link to="/results" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Post  result
                </Link>
              </li>

            </ul>
          </div>
          <div>
            <h3 className="text-gold-500 uppercase text-xs font-semibold tracking-wider mb-2 mt-4">Auctions</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/auctions" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  View All Auctions
                </Link>
              </li>
              <li>
                <Link to="/admin/create-auction" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Create Auction
                </Link>
              </li>
              <li>
                <Link to="/admin/manage-auctions" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Manage Auctions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gold-500 uppercase text-xs font-semibold tracking-wider mb-2 mt-4">Knockout & Standings</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/admin/manage-kos" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Manage KO Results
                </Link>
              </li>
              <li>
                <Link to="/public-ko" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Public KO View
                </Link>
              </li>
              <li>
                <Link to="/standings" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Manage Standings
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gold-500 uppercase text-xs font-semibold tracking-wider mb-2 mt-4">Archive</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/admin/trophy-management" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Trophy Management
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gold-500 uppercase text-xs font-semibold tracking-wider mb-2 mt-4">Authentication</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/login" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {showWarning && (
            <div className="mb-6 bg-yellow-900/30 border-l-4 border-yellow-500 p-4">
              <p className="font-bold text-yellow-300">Important Notice:</p>
              <p className="text-yellow-200">
                Welcome {user.username}! Please do not delete or modify any content without consulting <span className="font-semibold">amer</span> first.
              </p>
            </div>
          )}
          {/* Header */}
          <div className="mb-8 border-b border-gold-500 pb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gold-400 mb-2">{getGreeting()}</h1>
            <p className="text-gold-300">Manage all competition activities</p>
          </div>
          {/* --- NEW QUICK ANNOUNCEMENT SECTION --- */}
          <div className="bg-gray-800/50 border border-gold-700/30 rounded-xl p-6 mb-8 hover:border-gold-500/50 transition-all duration-300">
            <h2 className="text-2xl font-bold text-gold-300 mb-4">📢 Post a Quick Announcement</h2>
            <p className="text-sm text-gold-400/80 mb-4">This will appear on the homepage announcement ticker.</p>

            <form onSubmit={handleAnnouncementSubmit}>
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                className="w-full bg-gray-900/70 border border-gold-700/40 rounded-lg p-3 text-gold-200 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition duration-200"
                rows="3"
                placeholder="Enter announcement text... You can use **bold** for emphasis."
              ></textarea>

              {/* Status Message */}
              {status.message && (
                <p className={`mt-3 text-sm font-semibold ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-4 px-6 py-2 bg-gold-600 text-gray-900 font-bold rounded-lg hover:bg-gold-500 transition-colors duration-200 disabled:bg-gold-800/50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting...
                  </>
                ) : 'Post to Homepage'}
              </button>
            </form>

            {/* Move this outside and style it to align right */}
            <div className="mt-4 text-right">
              <Link to="/manage-announcements" className="inline-block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                Manage Announcements
              </Link>
            </div>
          </div>

          {/* Dashboard Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Competition Management */}
            <div className="bg-gray-800/50 border border-gold-700/30 rounded-xl p-6 hover:border-gold-500/50 transition-all duration-200 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gold-900/20 flex items-center justify-center mr-4 border border-gold-700/50">
                  <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gold-300 group-hover:text-gold-200">Competitions</h2>
              </div>
              <div className="space-y-3">
                <Link
                  to="/competitions"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Competitions
                </Link>
                <Link
                  to="/admin/manage-competitions"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Manage Competitions
                </Link>
                <Link
                  to="/admin/create-competition"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Competition
                </Link>
                <Link
                  to="/admin/update-competition"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Update Competition
                </Link>
              </div>
            </div>

            {/* Fixtures & Results */}
            <div className="bg-gray-800/50 border border-gold-700/30 rounded-xl p-6 hover:border-gold-500/50 transition-all duration-200 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gold-900/20 flex items-center justify-center mr-4 border border-gold-700/50">
                  <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gold-300 group-hover:text-gold-200">Fixtures & Results</h2>
              </div>
              <div className="space-y-3">
                <Link
                  to="/fixtures"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Fixtures
                </Link>
                <Link
                  to="/admin/create-fixture"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Fixture
                </Link>
                <Link
                  to="/admin/manage-fixtures"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Manage Fixtures
                </Link>
                <Link
                  to="/results"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Post League game result
                </Link>
                <Link
                  to="/admin/clan-war-management"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Post Clan War Result
                </Link>

              </div>
            </div>

            {/* Players Management */}
            <div className="bg-gray-800/50 border border-gold-700/30 rounded-xl p-6 hover:border-gold-500/50 transition-all duration-200 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gold-900/20 flex items-center justify-center mr-4 border border-gold-700/50">
                  <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gold-300 group-hover:text-gold-200">Players</h2>
              </div>
              <div className="space-y-3">
                <Link
                  to="/admin/manage-players"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Manage Players
                </Link>
              </div>
            </div>
            {/* Auctions Management */}
            <div className="bg-gray-800/50 border border-gold-700/30 rounded-xl p-6 hover:border-gold-500/50 transition-all duration-200 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gold-900/20 flex items-center justify-center mr-4 border border-gold-700/50">
                  <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6m3-3l2-2m4 4l2-2m-8 8l2-2m4 4l2-2" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gold-300 group-hover:text-gold-200">Auctions</h2>
              </div> 
              <div className="space-y-3">
                <Link
                  to="/auctions"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6m3-3l2-2m4 4l2-2m-8 8l2-2m4 4l2-2" />
                  </svg>
                  View All Auctions
                </Link>
                <Link
                  to="/admin/create-auction"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6m3-3l2-2m4 4l2-2m-8 8l2-2m4 4l2-2" />
                  </svg>
                  Create Auction
                </Link>
                <Link
                  to="/admin/manage-auctions"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                > 
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6m3-3l2-2m4 4l2-2m-8 8l2-2m4 4l2-2" />
                  </svg>
                  Manage Auctions
                </Link>
              </div>
            </div>
            
              {/* Knockout & Standings */}    
            <div className="bg-gray-800/50 border border-gold-700/30 rounded-xl p-6 hover:border-gold-500/50 transition-all duration-200 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gold-900/20 flex items-center justify-center mr-4 border border-gold-700/50">
                  <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gold-300 group-hover:text-gold-200">Knockout & Standings</h2>
              </div>
              <div className="space-y-3">
                <Link
                  to="/admin/manage-kos"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Manage KO Results
                </Link>
                <Link
                  to="/public-ko"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Public KO View
                </Link>
                <Link
                  to="/standings"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Manage Standings
                </Link>
              </div>
            </div>

            {/* Archive & Winners */}
            <div className="bg-gray-800/50 border border-gold-700/30 rounded-xl p-6 hover:border-gold-500/50 transition-all duration-200 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gold-900/20 flex items-center justify-center mr-4 border border-gold-700/50">
                  <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gold-300 group-hover:text-gold-200">Archive</h2>
              </div>
              <div className="space-y-3">
                <Link
                  to="/admin/trophy-management"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Trophy Management
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800/50 border border-gold-700/30 rounded-xl p-6 hover:border-gold-500/50 transition-all duration-200 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gold-900/20 flex items-center justify-center mr-4 border border-gold-700/50">
                  <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gold-300 group-hover:text-gold-200">Quick Access</h2>
              </div>
              <div className="space-y-3">
                <Link
                  to="/admin/applicant-list"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  view applications
                </Link>
                <Link
                  to="/upload-wallpaper"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  upload wallpaper
                </Link>

                <Link
                  to="/delete-wallpaper"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  delete wallpaper
                </Link>
                <Link
                  to="/post-winner"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  post a winner                </Link>
                <Link
                  to="/"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Go to Home
                </Link>

                <Link
                  to="/login"
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Admin Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
