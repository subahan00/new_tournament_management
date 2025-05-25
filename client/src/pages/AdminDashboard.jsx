import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
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
                <Link to="/admin" className="block px-3 py-2 rounded bg-gold-900/20 text-gold-200 hover:bg-gold-800/30">
                  Dashboard Overview
                </Link>
              </li>
              <li>
                <Link to="/admin/notifications" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Notifications
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gold-500 uppercase text-xs font-semibold tracking-wider mb-2 mt-4">Competitions</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/admin/competitions" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  All Competitions
                </Link>
              </li>
              <li>
                <Link to="/admin/create-competition" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Create Competition
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gold-500 uppercase text-xs font-semibold tracking-wider mb-2 mt-4">Teams & Players</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/admin/manage-teams" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Team Management
                </Link>
              </li>
              <li>
                <Link to="/admin/manage-players" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Player Management
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gold-500 uppercase text-xs font-semibold tracking-wider mb-2 mt-4">Fixtures</h3>
            <ul className="space-y-1">
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
            </ul>
          </div>

          <div>
            <h3 className="text-gold-500 uppercase text-xs font-semibold tracking-wider mb-2 mt-4">System</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/admin/settings" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  Settings
                </Link>
              </li>
              <li>
                <Link to="/admin/users" className="block px-3 py-2 rounded text-gold-300 hover:bg-gold-800/30">
                  User Management
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 border-b border-gold-500 pb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gold-400 mb-2">Admin Dashboard</h1>
            <p className="text-gold-300">Manage all competition activities</p>
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
                  to="/admin/create-fixture" 
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Fixture
                </Link>
                <Link 
                  to="/admin/manage-kos" 
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Post Match Result
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
              </div>
            </div>

            {/* Teams & Players */}
            <div className="bg-gray-800/50 border border-gold-700/30 rounded-xl p-6 hover:border-gold-500/50 transition-all duration-200 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gold-900/20 flex items-center justify-center mr-4 border border-gold-700/50">
                  <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gold-300 group-hover:text-gold-200">Teams & Players</h2>
              </div>
              <div className="space-y-3">
                <Link 
                  to="/admin/manage-teams" 
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Manage Teams
                </Link>
                <Link 
                  to="/admin/manage-players" 
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Manage Players
                </Link>
                <Link 
                  to="/admin/player-stats" 
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Player Statistics
                </Link>
              </div>
            </div>

            {/* System Management */}
            <div className="bg-gray-800/50 border border-gold-700/30 rounded-xl p-6 hover:border-gold-500/50 transition-all duration-200 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gold-900/20 flex items-center justify-center mr-4 border border-gold-700/50">
                  <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gold-300 group-hover:text-gold-200">System</h2>
              </div>
              <div className="space-y-3">
                <Link 
                  to="/admin/settings" 
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  System Settings
                </Link>
                <Link 
                  to="/admin/users" 
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  User Management
                </Link>
                <Link 
                  to="/admin/backup" 
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Backup & Restore
                </Link>
              </div>
            </div>

            {/* Reports & Analytics */}
            <div className="bg-gray-800/50 border border-gold-700/30 rounded-xl p-6 hover:border-gold-500/50 transition-all duration-200 group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gold-900/20 flex items-center justify-center mr-4 border border-gold-700/50">
                  <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gold-300 group-hover:text-gold-200">Reports</h2>
              </div>
              <div className="space-y-3">
                <Link 
                  to="/admin/competition-reports" 
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Competition Reports
                </Link>
                <Link 
                  to="/admin/player-stats" 
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Player Statistics
                </Link>
                <Link 
                  to="/admin/financial-reports" 
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Financial Reports
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
                <h2 className="text-xl font-bold text-gold-300 group-hover:text-gold-200">Quick Actions</h2>
              </div>
              <div className="space-y-3">
                <Link 
                  to="/admin/quick-post" 
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Quick Post
                </Link>
                <Link 
                  to="/admin/bulk-actions" 
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Bulk Actions
                </Link>
                <Link 
                  to="/admin/notifications" 
                  className="block bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Send Notifications
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