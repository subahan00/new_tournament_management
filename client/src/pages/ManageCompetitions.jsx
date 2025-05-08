import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import competitionService from '../services/competitionService';

const ManageCompetitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [competitionToDelete, setCompetitionToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Validate competition data structure
  const validateCompetition = (comp) => ({
    id: comp?.id || '',
    name: comp?.name || 'Unnamed Competition',
    status: comp?.status || 'Unknown',
    startDate: comp?.startDate || new Date().toISOString(),
    endDate: comp?.endDate || new Date().toISOString(),
    teamsCount: comp?.teamsCount || comp?.teams?.length || 0
  });

  // Fetch competitions with data validation
  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      setError(null);
      const competitions = await competitionService.getAllCompetitions();
      
      if (Array.isArray(competitions)) {
        setCompetitions(competitions);
      } else {
        console.warn('Unexpected competitions format:', competitions);
        setError('Could not parse competitions data');
        setCompetitions([]);
      }
    } catch (err) {
      console.error('Fetch competitions error:', err);
      setError(err.message || 'Failed to fetch competitions. Please try again.');
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);



  // Safe filtering with null checks
  const filteredCompetitions = competitions.filter(comp => {
    const name = comp?.name?.toLowerCase() || '';
    const status = comp?.status?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    
    return name.includes(term) || status.includes(term);
  });

  const handleDelete = (id) => {
    setCompetitionToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!competitionToDelete) return;
    
    try {
      setLoading(true);
      await deleteCompetition(competitionToDelete);
      setCompetitions(prev => prev.filter(comp => comp.id !== competitionToDelete));
      setDeleteModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete competition');
      console.error('Error deleting competition:', err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && competitions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-gold-100 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gold-300">Loading competitions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-gold-100 p-4 md:p-6 flex items-center justify-center">
        <div className="bg-gray-800/50 border border-red-700/30 rounded-lg p-6 max-w-md w-full text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-bold text-gold-200 mb-2">Error Loading Competitions</h3>
          <p className="text-gold-300 mb-4">{error}</p>
          <button
            onClick={fetchCompetitions}
            className="px-4 py-2 bg-gold-700 text-white rounded-lg hover:bg-gold-600 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-900 text-gold-100 p-4 md:p-6">
      {/* Header and other components remain the same */}
      {/* ... rest of your JSX remains unchanged ... */}
      {/* Header */}
      <div className="mb-6 border-b border-gold-500 pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gold-400 mb-2">Manage Competitions</h1>
            <p className="text-gold-300">View, edit, and delete competitions</p>
          </div>
          <Link 
            to="/admin/create-competition" 
            className="mt-4 md:mt-0 bg-gold-700 hover:bg-gold-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Competition
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-gray-800/50 border border-gold-700/30 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gold-300 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                placeholder="Search competitions..."
                className="bg-gray-700 border border-gold-700/30 text-gold-100 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-gold-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gold-300 mb-1">Status</label>
            <select
              id="status"
              className="bg-gray-700 border border-gold-700/30 text-gold-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gold-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Competitions Table */}
      <div className="bg-gray-800/50 border border-gold-700/30 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gold-700/30">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">
                  Dates
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">
                  Teams
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gold-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800/50 divide-y divide-gold-700/30">
              {filteredCompetitions.length > 0 ? (
                filteredCompetitions.map((competition) => (
                  <tr key={competition.id} className="hover:bg-gray-800/70">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gold-200">{competition.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gold-300">
                        {new Date(competition.startDate).toLocaleDateString()} - {new Date(competition.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gold-300">{competition.teamsCount || competition.teams}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        competition.status === 'Active' ? 'bg-green-900/50 text-green-300' :
                        competition.status === 'Completed' ? 'bg-gray-700 text-gray-300' :
                        'bg-yellow-900/50 text-yellow-300'
                      }`}>
                        {competition.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/admin/update-competition/${competition.id}`}
                          className="text-gold-400 hover:text-gold-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(competition.id)}
                          className="text-red-400 hover:text-red-300"
                          disabled={loading}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gold-300">
                    {searchTerm ? 'No competitions match your search' : 'No competitions found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gold-700/30 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gold-200">Delete Competition</h3>
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="text-gold-400 hover:text-gold-300"
                disabled={loading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gold-300 mb-6">
              Are you sure you want to delete this competition? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={loading}
                className="px-4 py-2 border border-gold-700/30 text-gold-300 rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
};

export default ManageCompetitions;