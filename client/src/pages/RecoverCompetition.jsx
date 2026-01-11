import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import competitionService from '../services/competitionService';
import { 
  TrashIcon, 
  CheckCircle, 
  ArrowLeft, 
  Loader2, 
  RotateCcw,
  AlertTriangle,
  Trash2,
  RefreshCw
} from 'lucide-react';

const RecoverCompetitions = () => {
  const [deletedCompetitions, setDeletedCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'recover' or 'permanent-delete'
  
  const [competitionsToProcess, setCompetitionsToProcess] = useState([]);
  const [selectedCompetitions, setSelectedCompetitions] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [actionStatus, setActionStatus] = useState(null);
  const [actionProgress, setActionProgress] = useState(0);

  // Fetch deleted competitions
  const fetchDeletedCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedCompetitions = await competitionService.getDeletedCompetitions();
      console.log('hsfh-',fetchedCompetitions)
      
      if (Array.isArray(fetchedCompetitions)) {
        setDeletedCompetitions(fetchedCompetitions.map(c => ({ 
          ...c, 
          uniqueId: c._id || c.id || Math.random().toString() 
        })));
      } else {
        console.warn('Unexpected deleted competitions format:', fetchedCompetitions);
        setError('Could not parse deleted competitions data');
        setDeletedCompetitions([]);
      }
    } catch (err) {
      console.error('Fetch deleted competitions error:', err);
      setError(err.message || 'Failed to fetch deleted competitions. Please try again.');
      setDeletedCompetitions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeletedCompetitions();
  }, [fetchDeletedCompetitions]);

  // Filter competitions
  const filteredCompetitions = deletedCompetitions.filter(comp => {
    const name = comp?.name?.toLowerCase() || '';
    const type = comp?.type?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    
    const matchesSearch = name.includes(term);
    const matchesType = typeFilter ? type === typeFilter.toLowerCase() : true;
    
    return matchesSearch && matchesType;
  });

  // Selection handlers
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

  // Open action modal
  const openActionModal = (ids, type) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    setCompetitionsToProcess(ids);
    setActionType(type);
    setActionStatus(null);
    setActionProgress(0);
    setActionModalOpen(true);
  };

  // Recover competitions
  const confirmRecover = async () => {
    if (competitionsToProcess.length === 0) return;

    setActionStatus({ 
      processing: true, 
      message: `Recovering ${competitionsToProcess.length} competition(s)...` 
    });
    setActionProgress(0);

    const totalToProcess = competitionsToProcess.length;
    const results = {
      successful: [],
      failed: []
    };

    // Use bulk recovery if multiple competitions
    if (totalToProcess > 1) {
      try {
        const response = await competitionService.bulkRecoverCompetitions(competitionsToProcess);
        
        if (response.results) {
          results.successful = response.results.successful.map(r => r.id);
          results.failed = response.results.failed;
        }
        
        setActionProgress(100);
      } catch (err) {
        console.error('Bulk recovery error:', err);
        results.failed = competitionsToProcess.map(id => ({ id, reason: err.message }));
      }
    } else {
      // Single recovery
      for (const id of competitionsToProcess) {
        try {
          await competitionService.recoverCompetition(id);
          results.successful.push(id);
        } catch (err) {
          results.failed.push({ id, reason: err.message });
          console.error(`Failed to recover competition ${id}:`, err);
        }
        setActionProgress(((results.successful.length + results.failed.length) / totalToProcess) * 100);
      }
    }

    // Update UI
    setDeletedCompetitions(prev => 
      prev.filter(c => !results.successful.includes(c.uniqueId))
    );
    setSelectedCompetitions([]);

    if (results.failed.length > 0) {
      setActionStatus({
        error: true,
        message: `Recovered ${results.successful.length} of ${totalToProcess}. Some recoveries failed.`,
        details: results.failed
      });
    } else {
      setActionStatus({ 
        success: true, 
        message: 'All selected competitions recovered successfully!' 
      });
    }

    setTimeout(() => {
      setActionModalOpen(false);
      setActionStatus(null);
    }, 3000);
  };

  // Permanently delete competitions
  const confirmPermanentDelete = async () => {
    if (competitionsToProcess.length === 0) return;

    setActionStatus({ 
      processing: true, 
      message: `Permanently deleting ${competitionsToProcess.length} competition(s)...` 
    });
    setActionProgress(0);

    const totalToProcess = competitionsToProcess.length;
    const results = {
      successful: [],
      failed: []
    };

    for (const id of competitionsToProcess) {
      try {
        await competitionService.permanentlyDeleteCompetition(id);
        results.successful.push(id);
      } catch (err) {
        results.failed.push({ id, reason: err.message });
        console.error(`Failed to permanently delete competition ${id}:`, err);
      }
      setActionProgress(((results.successful.length + results.failed.length) / totalToProcess) * 100);
    }

    // Update UI
    setDeletedCompetitions(prev => 
      prev.filter(c => !results.successful.includes(c.uniqueId))
    );
    setSelectedCompetitions([]);

    if (results.failed.length > 0) {
      setActionStatus({
        error: true,
        message: `Deleted ${results.successful.length} of ${totalToProcess}. Some deletions failed.`,
        details: results.failed
      });
    } else {
      setActionStatus({ 
        success: true, 
        message: 'All selected competitions permanently deleted!' 
      });
    }

    setTimeout(() => {
      setActionModalOpen(false);
      setActionStatus(null);
    }, 3000);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get unique types for filter
  const uniqueTypes = [...new Set(deletedCompetitions.map(c => c.type))].filter(Boolean);

  if (loading && deletedCompetitions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-gold-100 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gold-300">Loading deleted competitions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-gold-100 p-4 md:p-6 flex items-center justify-center">
        <div className="bg-gray-800/50 border border-red-700/30 rounded-lg p-6 max-w-md w-full text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-bold text-gold-200 mb-2">Error Loading</h3>
          <p className="text-gold-300 mb-4">{error}</p>
          <button
            onClick={fetchDeletedCompetitions}
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
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/manage-competitions"
          className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Manage Competitions
        </Link>
      </div>

      <div className="mb-6 border-b border-gold-500 pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gold-400 mb-2 flex items-center gap-2">
              <TrashIcon className="w-8 h-8" />
              Recover Competitions
            </h1>
            <p className="text-gold-300">
              Restore deleted competitions with all their data
            </p>
          </div>
          <button 
            onClick={fetchDeletedCompetitions}
            className="mt-4 md:mt-0 bg-gold-700 hover:bg-gold-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors duration-200"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Info Banner */}
      {deletedCompetitions.length > 0 && (
        <div className="mb-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-200">
            <p className="font-semibold mb-1">Recovery Information</p>
            <p>Recovering a competition will restore all associated fixtures, standings, and player data. 
            Permanent deletion cannot be undone.</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 bg-gray-800/50 border border-gold-700/30 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gold-300 mb-1">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                placeholder="Search deleted competitions..."
                className="bg-gray-700 border border-gold-700/30 text-gold-100 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-gold-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gold-300 mb-1">
              Type
            </label>
            <select
              id="type"
              className="bg-gray-700 border border-gold-700/30 text-gold-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gold-500 w-full md:w-auto"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openActionModal(selectedCompetitions, 'recover')}
              disabled={selectedCompetitions.length === 0}
              className="mt-5 md:mt-0 px-4 py-2 bg-green-600/80 text-white rounded-lg flex items-center justify-center transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-green-600"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Recover ({selectedCompetitions.length})
            </button>
            <button
              onClick={() => openActionModal(selectedCompetitions, 'permanent-delete')}
              disabled={selectedCompetitions.length === 0}
              className="mt-5 md:mt-0 px-4 py-2 bg-red-600/80 text-white rounded-lg flex items-center justify-center transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-red-600"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete Forever ({selectedCompetitions.length})
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
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">
                  Deleted On
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">
                  Data
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gold-400 uppercase tracking-wider">
                  Actions
                </th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gold-200">{competition.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-900/50 text-purple-300">
                        {competition.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gold-300">{formatDate(competition.deletedAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gold-400">
                        {competition.recoverableData?.fixtures || 0} fixtures, {' '}
                        {competition.recoverableData?.standings || 0} standings
                        {competition.type === 'CLAN_WAR' && `, ${competition.recoverableData?.clans || 0} clans`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => openActionModal([competition.uniqueId], 'recover')}
                          className="text-green-400 hover:text-green-300"
                          title="Recover"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => openActionModal([competition.uniqueId], 'permanent-delete')}
                          className="text-red-400 hover:text-red-300"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                      <p className="text-lg font-semibold text-gold-200 mb-2">No Deleted Competitions</p>
                      <p className="text-sm text-gold-300">
                        {searchTerm || typeFilter 
                          ? 'No competitions match your search criteria' 
                          : 'All competitions are active. Deleted competitions will appear here.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {actionModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gold-500/30 rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gold-200">
                {actionStatus?.success ? 'Success!' : 
                 actionStatus?.error ? 'Error' : 
                 actionType === 'recover' ? 'Confirm Recovery' : 'Confirm Permanent Deletion'}
              </h3>
              <button 
                onClick={() => setActionModalOpen(false)} 
                className="text-gold-400 hover:text-gold-300"
              >
                ✕
              </button>
            </div>

            {actionStatus?.processing ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
                  <p className="text-gold-300">{actionStatus.message}</p>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gold-500 rounded-full transition-all duration-300"
                    style={{ width: `${actionProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : actionStatus?.success ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <p className="text-gold-300">{actionStatus.message}</p>
              </div>
            ) : actionStatus?.error ? (
              <div className="text-center py-6">
                <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-gold-300 mb-2">{actionStatus.message}</p>
                {actionStatus.details && actionStatus.details.length > 0 && (
                  <div className="mt-4 text-left max-h-40 overflow-y-auto">
                    <p className="text-sm text-gold-400 mb-2">Failed items:</p>
                    <ul className="text-xs text-red-300 space-y-1">
                      {actionStatus.details.map((item, idx) => (
                        <li key={idx}>• {item.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <>
                {actionType === 'recover' ? (
                  <>
                    <p className="text-gold-300 mb-6">
                      You are about to recover <strong>{competitionsToProcess.length}</strong> competition(s). 
                      This will restore all associated fixtures, standings, and player data.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={() => setActionModalOpen(false)} 
                        className="px-4 py-2 border border-gold-500/30 text-gold-300 rounded-lg hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={confirmRecover} 
                        className="px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg flex items-center"
                      >
                        <RotateCcw className="w-5 h-5 mr-2" />
                        Confirm Recovery
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <div className="flex items-start gap-3 mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-200">
                          <p className="font-semibold mb-1">Warning: This action cannot be undone!</p>
                          <p>You are about to permanently delete <strong>{competitionsToProcess.length}</strong> competition(s) 
                          and all associated data.</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={() => setActionModalOpen(false)} 
                        className="px-4 py-2 border border-gold-500/30 text-gold-300 rounded-lg hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={confirmPermanentDelete} 
                        className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg flex items-center"
                      >
                        <Trash2 className="w-5 h-5 mr-2" />
                        Delete Permanently
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecoverCompetitions;