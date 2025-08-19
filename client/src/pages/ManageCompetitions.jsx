import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import competitionService from '../services/competitionService'; // Assuming this service exists
import { TrashIcon, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';

const ManageCompetitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  // State to hold IDs of competitions to be deleted (single or bulk)
  const [competitionsToDelete, setCompetitionsToDelete] = useState([]);
  
  // State for managing selected competitions for bulk actions
  const [selectedCompetitions, setSelectedCompetitions] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // State to track deletion status (processing, success, error)
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [deleteProgress, setDeleteProgress] = useState(0);

  // Fetch competitions from the service
  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedCompetitions = await competitionService.getAllCompetitions();
      
      if (Array.isArray(fetchedCompetitions)) {
        // Ensure each competition has a unique ID, fallback to a random key if needed
        setCompetitions(fetchedCompetitions.map(c => ({ ...c, uniqueId: c._id || c.id || Math.random().toString() })));
      } else {
        console.warn('Unexpected competitions format:', fetchedCompetitions);
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
  }, []);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  // Filter competitions based on search term and status
  const filteredCompetitions = competitions.filter(comp => {
    const name = comp?.name?.toLowerCase() || '';
    const status = comp?.status?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    
    const matchesSearch = name.includes(term);
    const matchesStatus = statusFilter ? status === statusFilter.toLowerCase() : true;
    
    return matchesSearch && matchesStatus;
  });

  // Handlers for checkbox selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCompetitions(filteredCompetitions.map(c => c.uniqueId));
    } else {
      setSelectedCompetitions([]);
    }
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) {
      setSelectedCompetitions(prev => [...prev, id]);
    } else {
      setSelectedCompetitions(prev => prev.filter(compId => compId !== id));
    }
  };

  // Prepare and open the delete modal for single or bulk deletion
  const openDeleteModal = (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    setCompetitionsToDelete(ids);
    setDeleteStatus(null);
    setDeleteProgress(0);
    setDeleteModalOpen(true);
  };

  // The core deletion logic, now handles an array of IDs
  const confirmDelete = async () => {
    if (competitionsToDelete.length === 0) return;

    setDeleteStatus({ processing: true, message: `Deleting ${competitionsToDelete.length} competition(s)...` });
    setDeleteProgress(0);

    const totalToDelete = competitionsToDelete.length;
    const successfullyDeleted = [];
    const errors = [];

    for (const id of competitionsToDelete) {
      try {
        await competitionService.deleteCompetition(id);
        successfullyDeleted.push(id);
      } catch (err) {
        errors.push({ id, message: err.message });
        console.error(`Failed to delete competition ${id}:`, err);
      }
      // Update progress after each attempt
      setDeleteProgress(((successfullyDeleted.length + errors.length) / totalToDelete) * 100);
    }

    // Optimistic UI update: remove deleted items from state
    setCompetitions(prev => prev.filter(c => !successfullyDeleted.includes(c.uniqueId)));
    setSelectedCompetitions([]); // Clear selection after deletion

    if (errors.length > 0) {
      setDeleteStatus({
        error: true,
        message: `Deleted ${successfullyDeleted.length} of ${totalToDelete}. Some deletions failed.`
      });
    } else {
      setDeleteStatus({ success: true, message: 'All selected competitions deleted successfully!' });
    }

    // Close modal after showing the result message
    setTimeout(() => {
      setDeleteModalOpen(false);
      setDeleteStatus(null); // Reset for next time
    }, 2500);
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

  return (
    <div className="min-h-screen bg-gray-900 text-gold-100 p-4 md:p-6">
      <div className="mb-6">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

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
              className="bg-gray-700 border border-gold-700/30 text-gold-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gold-500 w-full md:w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          {/* Bulk Delete Button */}
          <div>
            <button
              onClick={() => openDeleteModal(selectedCompetitions)}
              disabled={selectedCompetitions.length === 0}
              className="w-full md:w-auto mt-5 md:mt-0 px-4 py-2 bg-red-600/80 text-white rounded-lg flex items-center justify-center transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-red-600"
            >
              <TrashIcon className="w-5 h-5 mr-2" />
              Delete ({selectedCompetitions.length})
            </button>
          </div>
        </div>
      </div>

      {/* Competitions Table */}
      <div className="bg-gray-800/50 border border-gold-700/30 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gold-700/30">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3">
                  <input 
                    type="checkbox"
                    className="form-checkbox h-4 w-4 bg-gray-700 border-gold-600 text-gold-500 rounded focus:ring-gold-500"
                    onChange={handleSelectAll}
                    checked={filteredCompetitions.length > 0 && selectedCompetitions.length === filteredCompetitions.length}
                    indeterminate={selectedCompetitions.length > 0 && selectedCompetitions.length < filteredCompetitions.length}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">Dates</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">Teams</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gold-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800/50 divide-y divide-gold-700/30">
              {filteredCompetitions.length > 0 ? (
                filteredCompetitions.map((competition) => (
                  <tr key={competition.uniqueId} className="hover:bg-gray-800/70">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox"
                        className="form-checkbox h-4 w-4 bg-gray-700 border-gold-600 text-gold-500 rounded focus:ring-gold-500"
                        checked={selectedCompetitions.includes(competition.uniqueId)}
                        onChange={(e) => handleSelectOne(e, competition.uniqueId)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gold-200">{competition.name}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gold-300">{new Date(competition.startDate).toLocaleDateString()} - {new Date(competition.endDate).toLocaleDateString()}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gold-300">{competition.teamsCount || competition.teams?.length || 0}</div></td>
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
                        <Link to={`/admin/update-competition/${competition.uniqueId}`} className="text-gold-400 hover:text-gold-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </Link>
                        <button onClick={() => openDeleteModal([competition.uniqueId])} className="text-red-400 hover:text-red-300">
                           <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gold-300">
                    {searchTerm || statusFilter ? 'No competitions match your criteria' : 'No competitions found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gold-500/30 rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gold-200">
                {deleteStatus?.success ? 'Success!' : deleteStatus?.error ? 'Error' : 'Confirm Deletion'}
              </h3>
              <button onClick={() => setDeleteModalOpen(false)} className="text-gold-400 hover:text-gold-300">✕</button>
            </div>

            {deleteStatus?.processing ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
                  <p className="text-gold-300">{deleteStatus.message}</p>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gold-500 rounded-full transition-all duration-300"
                    style={{ width: `${deleteProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : deleteStatus?.success ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <p className="text-gold-300">{deleteStatus.message}</p>
              </div>
            ) : deleteStatus?.error ? (
                 <div className="text-center py-6">
                    <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p className="text-gold-300">{deleteStatus.message}</p>
                 </div>
            ) : (
              <>
                <p className="text-gold-300 mb-6">
                  You are about to permanently delete <strong>{competitionsToDelete.length}</strong> competition(s). This will remove all associated data, including fixtures, standings, and stats.
                </p>
                <div className="flex justify-end space-x-3">
                  <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 border border-gold-500/30 text-gold-300 rounded-lg hover:bg-gray-700">Cancel</button>
                  <button onClick={confirmDelete} className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg flex items-center">
                    <TrashIcon className="w-5 h-5 mr-2" />
                    Confirm Deletion
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCompetitions;
