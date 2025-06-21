import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import fixtureService from '../services/fixtureService';
import io from 'socket.io-client';

export default function CompetitionResults() {
  const socket = io(`${process.env.REACT_APP_BACKEND_URL}`); 
  const { competitionId } = useParams();
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingFixture, setEditingFixture] = useState(null);
  const [scores, setScores] = useState({ home: 0, away: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(null);
  
  const fixturesPerPage = 6; // Number of fixtures per page

  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fixtureService.getCompetitionFixtures(competitionId);
        const fixturesData = Array.isArray(response?.data?.data) ? response.data.data : [];
        setFixtures(fixturesData);
      } catch (err) {
        console.error('Failed to fetch fixtures:', err);
        setError('Failed to load fixtures. Please try again later.');
        setFixtures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFixtures();

    // Set up socket listeners
    socket.on('playerNameUpdate', ({ playerId, newName }) => {
      setFixtures(prev => prev.map(f => ({
        ...f,
        homePlayerName: f.homePlayer === playerId ? newName : f.homePlayerName,
        awayPlayerName: f.awayPlayer === playerId ? newName : f.awayPlayerName,
        homePlayer: f.homePlayer === playerId ? { ...f.homePlayer, name: newName } : f.homePlayer,
        awayPlayer: f.awayPlayer === playerId ? { ...f.awayPlayer, name: newName } : f.awayPlayer
      })));
    });

    socket.on('fixtureUpdate', (updatedFixture) => {
      setFixtures(prev => prev.map(f => 
        f._id === updatedFixture._id ? updatedFixture : f
      ));
    });

    return () => {
      socket.off('playerNameUpdate');
      socket.off('fixtureUpdate');
    };
  }, [competitionId]);

  const handleResultSubmit = async (fixtureId) => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate scores
      const homeScore = Number(scores.home);
      const awayScore = Number(scores.away);
      
      if (isNaN(homeScore)) throw new Error('Home score must be a number');
      if (isNaN(awayScore)) throw new Error('Away score must be a number');

      await fixtureService.updateFixtureResult(fixtureId, {
        homeScore,
        awayScore
      });

      // Refresh fixtures after successful update
      const response = await fixtureService.getCompetitionFixtures(competitionId);
      const updatedFixtures = Array.isArray(response?.data?.data) ? response.data.data : [];
      setFixtures(updatedFixtures);
      setEditingFixture(null);
      setScores({ home: 0, away: 0 });
      setShowConfirmModal(false);
      setPendingSubmission(null);

    } catch (err) {
      console.error('Failed to update result:', err);
      setError(err.message || 'Failed to save result');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (fixture) => {
    setEditingFixture(fixture._id);
    setScores({
      home: fixture.homeScore || 0,
      away: fixture.awayScore || 0
    });
    setError(null);
  };

  const handleSubmitClick = (fixtureId) => {
    // Validate scores first
    const homeScore = Number(scores.home);
    const awayScore = Number(scores.away);
    
    if (isNaN(homeScore) || isNaN(awayScore)) {
      setError('Please enter valid scores');
      return;
    }

    setPendingSubmission(fixtureId);
    setShowConfirmModal(true);
  };

  const confirmSubmission = () => {
    if (pendingSubmission) {
      handleResultSubmit(pendingSubmission);
    }
  };

  const handleCancelEdit = () => {
    setEditingFixture(null);
    setScores({ home: 0, away: 0 });
    setError(null);
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setPendingSubmission(null);
  };

  // Filter fixtures based on search term
  const filteredFixtures = fixtures.filter(fixture => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const homePlayerName = fixture.homePlayer?.name?.toLowerCase() || '';
    const awayPlayerName = fixture.awayPlayer?.name?.toLowerCase() || '';
    return homePlayerName.includes(searchLower) || awayPlayerName.includes(searchLower);
  });

  // Group fixtures by matchday/round
  const groupedFixtures = filteredFixtures.reduce((groups, fixture) => {
    const matchday = fixture.round || 'Matchday 1';
    if (!groups[matchday]) {
      groups[matchday] = [];
    }
    groups[matchday].push(fixture);
    return groups;
  }, {});

  const sortedMatchdays = Object.keys(groupedFixtures).sort((a, b) => {
    const aNum = parseInt(a.replace(/\D/g, '')) || 0;
    const bNum = parseInt(b.replace(/\D/g, '')) || 0;
    return aNum - bNum;
  });

  // Pagination logic
  const totalFixtures = filteredFixtures.length;
  const totalPages = Math.ceil(totalFixtures / fixturesPerPage);
  const startIndex = (currentPage - 1) * fixturesPerPage;
  const endIndex = startIndex + fixturesPerPage;
  
  // Get current page fixtures
  const currentFixtures = filteredFixtures.slice(startIndex, endIndex);
  const currentGroupedFixtures = currentFixtures.reduce((groups, fixture) => {
    const matchday = fixture.round || 'Matchday 1';
    if (!groups[matchday]) {
      groups[matchday] = [];
    }
    groups[matchday].push(fixture);
    return groups;
  }, {});

  const currentSortedMatchdays = Object.keys(currentGroupedFixtures).sort((a, b) => {
    const aNum = parseInt(a.replace(/\D/g, '')) || 0;
    const bNum = parseInt(b.replace(/\D/g, '')) || 0;
    return aNum - bNum;
  });

  const renderPlayerName = (player, playerNameField) => {
    return playerNameField || player?.name || 'TBD';
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPaginationRange = () => {
    const range = [];
    const showRange = 5; // Show 5 page numbers at a time
    
    let start = Math.max(1, currentPage - Math.floor(showRange / 2));
    let end = Math.min(totalPages, start + showRange - 1);
    
    if (end - start < showRange - 1) {
      start = Math.max(1, end - showRange + 1);
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    return range;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border-2 border-yellow-500/30 shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Confirm Result Submission</h3>
                <p className="text-gray-300 mb-4">
                  Are you sure you want to submit this match result?
                </p>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-center space-x-4">
                    <span className="text-2xl font-bold text-yellow-500">{scores.home}</span>
                    <span className="text-xl text-gray-400">-</span>
                    <span className="text-2xl font-bold text-yellow-500">{scores.away}</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={confirmSubmission}
                  disabled={submitting}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    submitting 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent mr-2"></div>
                      Submitting...
                    </span>
                  ) : (
                    'Confirm & Submit'
                  )}
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 rounded-lg font-semibold text-gray-300 border border-gray-600 hover:bg-gray-800 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-xl">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-black text-center tracking-wide">
            COMPETITION RESULTS
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by player name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="w-full px-4 py-3 pl-12 bg-gray-900 border border-yellow-500/30 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          {searchTerm && (
            <p className="text-center text-yellow-400 mt-2 text-sm">
              Showing results for: <span className="font-semibold">"{searchTerm}"</span>
            </p>
          )}
        </div>

        {/* Pagination Info */}
        {!loading && totalFixtures > 0 && (
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm">
              Showing {startIndex + 1}-{Math.min(endIndex, totalFixtures)} of {totalFixtures} fixtures
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-yellow-500 border-t-transparent mb-4"></div>
            <p className="text-yellow-500 font-medium">Loading fixtures...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && Object.keys(currentGroupedFixtures).length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-700">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {searchTerm ? 'No matches found' : 'No fixtures available'}
              </h3>
              <p className="text-gray-500">
                {searchTerm ? `No fixtures found for "${searchTerm}"` : 'No matches found for this competition'}
              </p>
            </div>
          </div>
        )}

        {/* Fixtures by Matchday */}
        {!loading && Object.keys(currentGroupedFixtures).length > 0 && (
          <div className="space-y-8">
            {currentSortedMatchdays.map(matchday => (
              <div key={matchday} className="space-y-4">
                {/* Matchday Header */}
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4">
                  <h2 className="text-xl font-bold text-black text-center">
                    {matchday.toUpperCase()}
                  </h2>
                </div>

                {/* Fixtures for this matchday */}
                <div className="grid gap-4">
                  {currentGroupedFixtures[matchday].map((fixture) => (
                    <div key={fixture._id} className="bg-gray-900 rounded-lg border border-gray-700 hover:border-yellow-500/50 transition-all duration-300 overflow-hidden">
                      
                      {/* Match Info Header */}
                      <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-yellow-500 font-medium">
                            {fixture.matchDate ? new Date(fixture.matchDate).toLocaleDateString() : 'Date TBD'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            fixture.status === 'completed' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {fixture.status === 'completed' ? 'COMPLETED' : 'PENDING'}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        {/* Players Section */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="text-center flex-1">
                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                              <h3 className="text-white font-semibold text-lg mb-1">
                                   {renderPlayerName(fixture.homePlayer, fixture.homePlayerName)}
                              </h3>
                              <p className="text-yellow-500 text-sm font-medium">HOME</p>
                            </div>
                          </div>
                          
                          <div className="mx-6 text-center">
                            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-black font-bold">VS</span>
                            </div>
                          </div>
                          
                          <div className="text-center flex-1">
                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                              <h3 className="text-white font-semibold text-lg mb-1">
                                 {renderPlayerName(fixture.awayPlayer, fixture.awayPlayerName)}
                              </h3>
                              <p className="text-yellow-500 text-sm font-medium">AWAY</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Match Result Section */}
                        {editingFixture === fixture._id ? (
                          // EDITING MODE (for both new and existing results)
                          <div className="bg-blue-500/10 rounded-lg p-6 border border-blue-500/30">
                            <h4 className="text-blue-400 font-semibold text-center mb-4">
                              {fixture.status === 'completed' 
                                ? 'Update Match Result' 
                                : 'Enter Match Result'}
                            </h4>
                            <div className="flex items-center justify-center space-x-6 mb-6">
                              <div className="text-center">
                                <label className="block text-gray-300 text-sm font-medium mb-2">Home Score</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={scores.home}
                                  onChange={(e) => setScores({...scores, home: e.target.value})}
                                  className="w-16 h-12 text-center text-xl font-bold bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                                  disabled={submitting}
                                />
                              </div>
                              
                              <span className="text-2xl text-gray-400 font-bold">:</span>
                              
                              <div className="text-center">
                                <label className="block text-gray-300 text-sm font-medium mb-2">Away Score</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={scores.away}
                                  onChange={(e) => setScores({...scores, away: e.target.value})}
                                  className="w-16 h-12 text-center text-xl font-bold bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                                  disabled={submitting}
                                />
                              </div>
                            </div>
                            
                            <div className="flex justify-center space-x-3">
                              <button
                                onClick={() => handleSubmitClick(fixture._id)}
                                className="px-6 py-2 rounded-lg font-medium bg-yellow-500 hover:bg-yellow-600 text-black transition-all"
                                disabled={submitting}
                              >
                                {fixture.status === 'completed' 
                                  ? 'Update Result' 
                                  : 'Submit Result'}
                              </button>
                              
                              <button
                                onClick={handleCancelEdit}
                                className="px-6 py-2 rounded-lg font-medium text-gray-300 border border-gray-600 hover:bg-gray-800 transition-all"
                                disabled={submitting}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : fixture.status === 'completed' ? (
                          // COMPLETED MATCH WITH UPDATE OPTION
                          <div className="space-y-4">
                            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                              <div className="text-center">
                                <div className="flex items-center justify-center space-x-4 mb-2">
                                  <span className="text-3xl font-bold text-white">{fixture.homeScore}</span>
                                  <span className="text-xl text-gray-400">-</span>
                                  <span className="text-3xl font-bold text-white">{fixture.awayScore}</span>
                                </div>
                                {fixture.result && (
                                  <div className="inline-block bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium capitalize border border-yellow-500/30">
                                    {fixture.result}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleEditClick(fixture)}
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Update Result
                            </button>
                          </div>
                        ) : (
                          // ADD RESULT BUTTON FOR PENDING MATCHES
                          <button
                            onClick={() => handleEditClick(fixture)}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 rounded-lg transition-all duration-300"
                          >
                            Add Result
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="flex items-center space-x-2">
              {/* Previous Button */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 1
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-yellow-500 hover:bg-gray-700 border border-yellow-500/30'
                }`}
              >
                Previous
              </button>

              {/* Page Numbers */}
              {getPaginationRange().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                    currentPage === page
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-800 text-yellow-500 hover:bg-gray-700 border border-yellow-500/30'
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Next Button */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === totalPages
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-yellow-500 hover:bg-gray-700 border border-yellow-500/30'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}