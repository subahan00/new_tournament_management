import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Search, Edit, AlertTriangle, Inbox } from 'lucide-react';
import io from 'socket.io-client';
import fixtureService from '../services/fixtureService';



export default function CompetitionResults() {
  const socket = io(`${process.env.REACT_APP_BACKEND_URL}`);
  const { competitionId } = useParams();

  // --- STATE MANAGEMENT ---
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

  const fixturesPerPage = 6;

  // --- DATA FETCHING & REAL-TIME UPDATES ---
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

    // Socket listeners for real-time updates
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

  // --- EVENT HANDLERS ---
  const handleResultSubmit = async (fixtureId) => {
    try {
      setSubmitting(true);
      setError(null);

      const homeScore = Number(scores.home);
      const awayScore = Number(scores.away);

      if (isNaN(homeScore) || isNaN(awayScore)) {
        throw new Error('Scores must be valid numbers.');
      }

      await fixtureService.updateFixtureResult(fixtureId, { homeScore, awayScore });

      // Refresh data and reset state
      const response = await fixtureService.getCompetitionFixtures(competitionId);
      setFixtures(Array.isArray(response?.data?.data) ? response.data.data : []);
      setEditingFixture(null);
      setScores({ home: 0, away: 0 });
      setShowConfirmModal(false);
      setPendingSubmission(null);

    } catch (err) {
      console.error('Failed to update result:', err);
      setError(err.message || 'Failed to save the result.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (fixture) => {
    setEditingFixture(fixture._id);
    setScores({
      home: fixture.homeScore ?? 0,
      away: fixture.awayScore ?? 0
    });
    setError(null);
  };

  const handleSubmitClick = (fixtureId) => {
    if (isNaN(Number(scores.home)) || isNaN(Number(scores.away))) {
      setError('Please enter valid scores.');
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
    setError(null);
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setPendingSubmission(null);
  };

  // --- DATA PROCESSING & FILTERING ---
  const filteredFixtures = fixtures.filter(fixture => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const homePlayerName = fixture.homePlayer?.name?.toLowerCase() || '';
    const awayPlayerName = fixture.awayPlayer?.name?.toLowerCase() || '';
    return homePlayerName.includes(searchLower) || awayPlayerName.includes(searchLower);
  }).sort((a, b) => {
    // If a search term is present, sort by status: pending first, then completed.
    if (searchTerm) {
      if (a.status === 'pending' && b.status !== 'pending') {
        return -1; // a comes first
      }
      if (a.status !== 'pending' && b.status === 'pending') {
        return 1; // b comes first
      }
    }
    // If no search term or statuses are the same, maintain default order.
    return 0;
  });


  const groupedFixtures = filteredFixtures.reduce((groups, fixture) => {
    const matchday = fixture.round || 'Unclassified';
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

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(sortedMatchdays.length / fixturesPerPage); // Paginate by matchday groups
  const paginatedMatchdays = sortedMatchdays.slice((currentPage - 1) * fixturesPerPage, currentPage * fixturesPerPage);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPaginationRange = () => {
    const range = [];
    const showRange = 5;
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

  const renderPlayerName = (player, playerNameField) => playerNameField || player?.name || 'TBD';

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-black to-[#1a1a1a] text-gray-200 font-sans">
      <div className="container mx-auto px-4 py-8">
        
        {/* Back to Dashboard Link */}
        <div className="mb-8">
          <Link
            to="/results"
            className="group inline-flex items-center gap-2 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-yellow-500/10 hover:border-yellow-500/60 hover:shadow-lg hover:shadow-yellow-500/10"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fadeIn">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-yellow-500/30 shadow-2xl shadow-yellow-500/5 max-w-md w-full animate-scaleIn">
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/30">
                    <AlertTriangle className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Confirm Submission</h3>
                  <p className="text-gray-400 mb-6">Are you sure you want to submit this result? This action cannot be undone.</p>
                  <div className="bg-black/40 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-center space-x-4">
                      <span className="text-3xl font-bold text-white">{scores.home}</span>
                      <span className="text-2xl text-gray-500">-</span>
                      <span className="text-3xl font-bold text-white">{scores.away}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={confirmSubmission}
                    disabled={submitting}
                    className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:shadow-lg hover:shadow-yellow-500/20 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400"
                  >
                    {submitting ? 'Submitting...' : 'Confirm & Submit'}
                  </button>
                  <button
                    onClick={handleCancelConfirm}
                    disabled={submitting}
                    className="flex-1 py-3 px-4 rounded-lg font-semibold text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <header className="text-center mb-12">
            <h1 className="text-5xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-400 pb-2">
                COMPETITION RESULTS
            </h1>
            <p className="text-gray-500 mt-2">Manage and view match outcomes in real-time.</p>
        </header>

        {/* Search & Filters */}
        <div className="mb-10">
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for a player..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-12 pr-4 py-3 bg-black/30 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                <Search className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading / Error / Empty States */}
        {loading && <div className="text-center py-16 text-yellow-400">Loading fixtures...</div>}
        {error && !loading && <div className="text-center py-16 text-red-400">{error}</div>}
        {!loading && !error && filteredFixtures.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-black/20 rounded-lg p-10 border border-gray-800 max-w-md mx-auto">
              <Inbox className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300">
                {searchTerm ? 'No Matches Found' : 'No Fixtures Available'}
              </h3>
              <p className="text-gray-500 mt-2">
                {searchTerm ? `Your search for "${searchTerm}" did not return any results.` : 'Fixtures for this competition will appear here.'}
              </p>
            </div>
          </div>
        )}

        {/* Fixtures List */}
        {!loading && paginatedMatchdays.length > 0 && (
          <div className="space-y-12">
            {paginatedMatchdays.map(matchday => (
              <div key={matchday}>
                <h2 className="text-2xl font-bold text-center mb-6 border-b-2 border-yellow-500/20 pb-2 text-yellow-400">
                  {matchday.toUpperCase()}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedFixtures[matchday].map((fixture) => (
                    <div 
                      key={fixture._id} 
                      className="bg-gradient-to-br from-gray-900/80 to-black/80 rounded-xl border border-gray-800 transition-all duration-300 hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/10 hover:-translate-y-2"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6 text-sm">
                          <span className="font-medium text-gray-400">
                            {fixture.matchDate ? new Date(fixture.matchDate).toLocaleDateString() : 'Date TBD'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            fixture.status === 'completed' 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {fixture.status}
                          </span>
                        </div>
                        
                        {/* Player Names and Score */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="text-center w-2/5">
                            <p className="text-lg font-semibold truncate">{renderPlayerName(fixture.homePlayer, fixture.homePlayerName)}</p>
                            <p className="text-xs text-gray-500 uppercase">HOME</p>
                          </div>
                          <div className="text-4xl font-black text-gray-600">VS</div>
                          <div className="text-center w-2/5">
                            <p className="text-lg font-semibold truncate">{renderPlayerName(fixture.awayPlayer, fixture.awayPlayerName)}</p>
                             <p className="text-xs text-gray-500 uppercase">AWAY</p>
                          </div>
                        </div>

                        {/* Result / Edit Section */}
                        {editingFixture === fixture._id ? (
                          <div className="bg-black/30 p-4 rounded-lg border border-yellow-500/30">
                            <div className="flex items-center justify-center space-x-4 mb-4">
                              <input type="number" min="0" value={scores.home} onChange={(e) => setScores({ ...scores, home: e.target.value })} className="w-20 h-14 text-center text-2xl font-bold bg-gray-800 border border-gray-700 rounded-lg focus:border-yellow-500 focus:outline-none" />
                              <span className="text-2xl text-gray-500">:</span>
                              <input type="number" min="0" value={scores.away} onChange={(e) => setScores({ ...scores, away: e.target.value })} className="w-20 h-14 text-center text-2xl font-bold bg-gray-800 border border-gray-700 rounded-lg focus:border-yellow-500 focus:outline-none" />
                            </div>
                            <div className="flex space-x-2">
                              <button onClick={() => handleSubmitClick(fixture._id)} className="w-full py-2 rounded-lg font-semibold bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:opacity-90">Submit</button>
                              <button onClick={handleCancelEdit} className="w-full py-2 rounded-lg font-semibold border border-gray-600 text-gray-300 hover:bg-gray-800">Cancel</button>
                            </div>
                          </div>
                        ) : fixture.status === 'completed' ? (
                          <div className="text-center space-y-4">
                              <div className="text-4xl font-bold">
                                  <span>{fixture.homeScore}</span>
                                  <span className="mx-4 text-gray-600">-</span>
                                  <span>{fixture.awayScore}</span>
                              </div>
                              <button onClick={() => handleEditClick(fixture)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10">
                                <Edit size={16} /> Update Result
                              </button>
                          </div>
                        ) : (
                          <button onClick={() => handleEditClick(fixture)} className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-yellow-400 to-yellow-600 text-black transition-all hover:shadow-lg hover:shadow-yellow-500/20">
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

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="mt-16 flex justify-center">
            <div className="flex items-center space-x-2 bg-black/30 border border-gray-800 p-2 rounded-lg">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors">Prev</button>
              {getPaginationRange().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-10 h-10 rounded-md font-medium transition-all ${currentPage === page ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black' : 'hover:bg-gray-800 text-gray-400'}`}
                >
                  {page}
                </button>
              ))}
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

