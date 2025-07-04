import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import fixtureService from '../services/fixtureService';
import { Trophy, ChevronLeft, Clock, Award, Calendar, Users, AlertTriangle, CheckCircle, Activity, X, Edit3 } from 'lucide-react';
import io from 'socket.io-client';

const ResultKo = () => {
  const socket = io(`${process.env.REACT_APP_BACKEND_URL}`);
  const { competitionId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [selectedCompetition, setSelectedCompetition] = useState(state?.competition || null);
  const [fixtures, setFixtures] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [scoreInputs, setScoreInputs] = useState({ homeScore: 0, awayScore: 0 });
  const [editMode, setEditMode] = useState(false);

  // Load competition data if not passed through state
  useEffect(() => {
    const loadCompetitionData = async () => {
      if (!selectedCompetition && competitionId) {
        try {
          setLoading(true);
          const competitions = await fixtureService.fetchCompetitions();
          const competition = competitions.find(comp => comp._id === competitionId);
          if (competition) {
            setSelectedCompetition(competition);
            await loadFixtures(competition);
          } else {
            setError('Competition not found');
          }
          setLoading(false);
        } catch (err) {
          setError('Failed to load competition data');
          setLoading(false);
        }
      } else if (selectedCompetition) {
        await loadFixtures(selectedCompetition);
      }
    };

    loadCompetitionData();

    // Set up socket listeners
    socket.on('playerNameUpdate', ({ playerId, newName }) => {
      setFixtures(prev => prev.map(f => ({
        ...f,
        homePlayerName: f.homePlayer?.$oid === playerId ? newName : f.homePlayerName,
        awayPlayerName: f.awayPlayer?.$oid === playerId ? newName : f.awayPlayerName,
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
  }, [competitionId, selectedCompetition]);

  // Load fixtures for the selected competition
  const loadFixtures = async (competition) => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      let fixturesData = await fixtureService.fetchFixturesByCompetition(competition._id);
      
      // Generate fixtures if none exist
      if (fixturesData.length === 0) {
        await fixtureService.generateFixtures(competition._id);
        fixturesData = await fixtureService.fetchFixturesByCompetition(competition._id);
      }

      setFixtures(fixturesData);
      organizeFixturesByRound(fixturesData, competition);
      setLoading(false);
    } catch (err) {
      setError('Failed to load or generate fixtures');
      console.error(err);
      setLoading(false);
    }
  };

  // Organize fixtures by rounds
  const organizeFixturesByRound = (fixturesData, competition) => {
    const roundOrder = {
      'Round of 64': 0,
      'Round of 32': 1,
      'Round of 16': 2,
      'Quarter Finals': 3,
      'Semi Finals': 4,
      'Final': 5
    };

    // Get unique rounds and sort them properly
    const uniqueRounds = [...new Set(fixturesData.map(fixture => fixture.round))]
      .sort((a, b) => roundOrder[a] - roundOrder[b]);

    setRounds(uniqueRounds);

    // Set current round to the first incomplete round
    const firstIncomplete = uniqueRounds.find(round =>
      fixturesData.filter(f => f.round === round).some(f => f.status !== 'completed')
    ) || uniqueRounds[uniqueRounds.length - 1];

    setCurrentRound(firstIncomplete);
  };

  // Handle fixture result update using the new API endpoint
  const handleUpdateResult = async (fixtureId, homeScore, awayScore) => {
    try {
      setLoading(true);
      await fixtureService.updateFixtureResult(fixtureId, { homeScore, awayScore });

      // Refresh data
      const updatedFixtures = await fixtureService.fetchFixturesByCompetition(selectedCompetition._id);
      setFixtures(updatedFixtures);
      organizeFixturesByRound(updatedFixtures, selectedCompetition);

      setSuccessMessage('Result updated successfully!');
      setActiveModal(null);
            setEditMode(false); // Exit edit mode after update

      setTimeout(() => setSuccessMessage(''), 3000);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to update result');
      setLoading(false);
    }
  };

  // Handle advancing to next round
  const handleAdvanceToNextRound = async () => {
    try {
      setLoading(true);
      await fixtureService.advanceToNextRound(selectedCompetition._id, currentRound);

      // Refresh fixtures after advancing
      const updatedFixtures = await fixtureService.fetchFixturesByCompetition(selectedCompetition._id);
      setFixtures(updatedFixtures);
      organizeFixturesByRound(updatedFixtures, selectedCompetition);

      // Move to the next round in the UI
      const currentRoundIndex = rounds.indexOf(currentRound);
      if (currentRoundIndex < rounds.length - 1) {
        setCurrentRound(rounds[currentRoundIndex + 1]);
      }

      setSuccessMessage('Advanced to next round successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setLoading(false);
    } catch (err) {
      setError('Failed to advance to next round');
      setLoading(false);
    }
  };

  // Check if all fixtures in the current round are completed
  const isRoundCompleted = () => {
    if (!fixtures || !Array.isArray(fixtures)) return false;
    const currentRoundFixtures = fixtures.filter(fixture => fixture?.round === currentRound);
    
    return (
      currentRoundFixtures.length > 0 &&
      currentRoundFixtures.every(fixture => fixture?.status === 'completed')
    );
  };

  // Check if there is a next round available
  const hasNextRound = () => {
    if (!rounds || rounds.length === 0) return false;

    const roundOrder = {
      'Round of 64': 0,
      'Round of 32': 1,
      'Round of 16': 2,
      'Quarter Finals': 3,
      'Semi Finals': 4,
      'Final': 5
    };

    const currentRoundOrder = roundOrder[currentRound];
    return currentRoundOrder < 5;
  };

  // Get player name based on fixture data
  const getPlayerName = (player, fixture) => {
    if (!player) return 'Unknown Player';

    // Handle ObjectID format
    if (player._id) {
      const homeId = fixture?.homePlayer?._id;
      const awayId = fixture?.awayPlayer?._id;

      if (homeId && homeId === player._id) {
        return fixture.homePlayerName || 'Unknown Player';
      }

      if (awayId && awayId === player._id) {
        return fixture.awayPlayerName || 'Unknown Player';
      }

      return 'Unknown Player';
    }

    // Handle direct string names
    if (typeof player === 'string') return player;

    return 'Unknown Player';
  };

  // Get status badge color based on status
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-600/20 text-green-400 border border-green-600/30';
      case 'pending': return 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30';
      case 'upcoming': return 'bg-blue-600/20 text-blue-400 border border-blue-600/30';
      default: return 'bg-gray-600/20 text-gray-400 border border-gray-600/30';
    }
  };

  // Get status icon based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="mr-1" />;
      case 'pending': return <Clock size={16} className="mr-1" />;
      case 'upcoming': return <Calendar size={16} className="mr-1" />;
      default: return <Activity size={16} className="mr-1" />;
    }
  };

  // Render loading spinner
  const renderLoadingSpinner = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent"></div>
    </div>
  );

  const renderPlayerInitials = (player, fixture) => {
    const name = getPlayerName(player, fixture);
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2) || '?';
  };

  // Open modal for updating results
 const openModal = (fixture, isEdit = false) => {
    setActiveModal(fixture._id);
    setEditMode(isEdit);
    setScoreInputs({
      homeScore: fixture.homeScore || 0,
      awayScore: fixture.awayScore || 0
    });
  };

  // Close modal
  const closeModal = () => {
    setActiveModal(null);
    setScoreInputs({ homeScore: 0, awayScore: 0 });
  };

  // Handle score input changes
  const handleScoreChange = (field, value) => {
    setScoreInputs(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

  // Submit score update
  const handleSubmitScore = (fixtureId) => {
    handleUpdateResult(fixtureId, scoreInputs.homeScore, scoreInputs.awayScore);
  };

  // Render alert messages
  const renderAlerts = () => (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center">
          <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg flex items-center">
          <CheckCircle size={18} className="mr-2 flex-shrink-0" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}
    </div>
  );

  if (!selectedCompetition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded-lg">
          Competition not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-yellow-500/20 rounded-xl mb-6 p-4 lg:p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 lg:p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <Trophy size={28} className="text-yellow-400" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-yellow-400 mb-1">Tournament Results</h1>
                <p className="text-sm text-gray-400">Manage fixtures and update results</p>
              </div>
            </div>
            <button
              className="flex items-center px-4 py-2 bg-gray-800/50 border border-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/10 transition-all duration-200"
              onClick={() => navigate('/admin/manage-kos')}
            >
              <ChevronLeft size={18} className="mr-1" />
              <span className="text-sm">Back</span>
            </button>
          </div>
        </div>

        {renderAlerts()}

        {loading ? renderLoadingSpinner() : (
          <div className="space-y-6">
            {/* Competition Info Card */}
            <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-4 lg:p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                    <h2 className="text-lg lg:text-xl font-bold text-yellow-400">{selectedCompetition.name}</h2>
                    <span className={`${getStatusBadgeColor(selectedCompetition.status)} px-3 py-1 rounded-full text-xs font-medium w-fit`}>
                      {selectedCompetition.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-full text-xs flex items-center">
                      <Award size={12} className="mr-1" /> {selectedCompetition.type.replace('KO_', '')}
                    </span>
                    <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-full text-xs flex items-center">
                      <Users size={12} className="mr-1" /> {selectedCompetition.numberOfPlayers} players
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tournament Progress Section */}
            {rounds.length > 0 && (
              <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-4 lg:p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Tournament Progress</h3>
                
                {/* Mobile Progress */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
                  {rounds.map(round => (
                    <button
                      key={round}
                      className={`text-xs p-3 rounded-lg transition-all duration-200 font-medium ${
                        currentRound === round
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black shadow-lg'
                          : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-yellow-500/10 hover:text-yellow-400'
                      }`}
                      onClick={() => setCurrentRound(round)}
                    >
                      {round}
                    </button>
                  ))}
                </div>

                {/* Advance Button */}
                {currentRound !== 'Final' && (
                  <button
                    className={`w-full sm:w-auto py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 font-medium ${
                      isRoundCompleted() && hasNextRound()
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black hover:from-yellow-400 hover:to-yellow-300 shadow-lg'
                        : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!isRoundCompleted() || !hasNextRound()}
                    onClick={handleAdvanceToNextRound}
                  >
                    <Trophy size={20} />
                    <span>Advance Winners</span>
                  </button>
                )}
              </div>
            )}

            {/* Fixtures Section */}
            <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-yellow-500/20 rounded-xl overflow-hidden shadow-2xl">
              <div className="px-4 lg:px-6 py-4 border-b border-yellow-500/20 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-yellow-400 flex items-center">
                  <Trophy size={18} className="mr-2" />
                  {currentRound} Fixtures
                </h3>
                {isRoundCompleted() && (
                  <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-full flex items-center text-xs">
                    <CheckCircle size={14} className="mr-1" />
                    Completed
                  </span>
                )}
              </div>

              <div className="p-4 lg:p-6">
              {Array.isArray(fixtures) && fixtures.filter(fixture => fixture.round === currentRound).length > 0 ? (
                <div className="space-y-4">
                  {fixtures
                    .filter(fixture => fixture.round === currentRound)
                    .map(fixture => (
                      <div
                        key={fixture._id}
                        className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-700/50 rounded-lg p-4 hover:border-yellow-500/30 transition-all duration-200"
                      >
                          {/* Desktop View */}
                          <div className="hidden lg:flex items-center justify-between">
                            <div className="flex items-center space-x-6 flex-1">
                              <div className="text-gray-300 font-medium w-48">
                                {getPlayerName(fixture.homePlayer, fixture)}
                              </div>
                              <div className="text-center">
                                {fixture.status === 'completed' ? (
                                  <div className="px-4 py-2 bg-yellow-500/10 rounded-full inline-flex items-center border border-yellow-500/20">
                                    <span className={`font-bold ${fixture.homeScore > fixture.awayScore ? 'text-green-400' : 'text-gray-400'}`}>
                                      {fixture.homeScore}
                                    </span>
                                    <span className="mx-2 text-yellow-400">-</span>
                                    <span className={`font-bold ${fixture.awayScore > fixture.homeScore ? 'text-green-400' : 'text-gray-400'}`}>
                                      {fixture.awayScore}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="bg-gray-700/50 text-gray-400 border border-gray-600/50 px-3 py-1 rounded-full text-sm">
                                    Not played
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-300 font-medium w-48">
                                {getPlayerName(fixture.awayPlayer, fixture)}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className={`flex items-center px-3 py-1 rounded-full text-xs ${getStatusBadgeColor(fixture.status)}`}>
                                {getStatusIcon(fixture.status)}
                                {fixture.status}
                              </span>
                              {(fixture.status === 'pending' || fixture.status === 'completed') && (
                              <button
                                className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-4 py-2 rounded-lg hover:bg-yellow-500/20 flex items-center transition-all duration-200"
                                onClick={() => openModal(fixture, fixture.status === 'completed')}
                              >
                                <Edit3 size={16} className="mr-2" />
                                {fixture.status === 'pending' ? 'Add Result' : 'Edit Result'}
                              </button>
                            )}
                          </div>
                        </div>

                          {/* Mobile View */}
                          <div className="lg:hidden space-y-3">
                            <div className="flex items-center justify-between">
                              <span className={`flex items-center px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(fixture.status)}`}>
                                {getStatusIcon(fixture.status)}
                                {fixture.status}
                              </span>
                              {(fixture.status === 'pending' || fixture.status === 'completed') && (
                              <button
                                className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded-lg hover:bg-yellow-500/20 flex items-center transition-all duration-200 text-xs"
                                onClick={() => openModal(fixture, fixture.status === 'completed')}
                              >
                                <Edit3 size={14} className="mr-1" />
                                {fixture.status === 'pending' ? 'Add' : 'Edit'}
                              </button>
                            )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-300 font-medium">
                                {getPlayerName(fixture.homePlayer, fixture)}
                              </div>
                              <div className="text-center">
                                {fixture.status === 'completed' ? (
                                  <div className="px-3 py-1 bg-yellow-500/10 rounded-full inline-flex items-center border border-yellow-500/20">
                                    <span className={`font-bold text-sm ${fixture.homeScore > fixture.awayScore ? 'text-green-400' : 'text-gray-400'}`}>
                                      {fixture.homeScore}
                                    </span>
                                    <span className="mx-2 text-yellow-400">-</span>
                                    <span className={`font-bold text-sm ${fixture.awayScore > fixture.homeScore ? 'text-green-400' : 'text-gray-400'}`}>
                                      {fixture.awayScore}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="bg-gray-700/50 text-gray-400 border border-gray-600/50 px-2 py-1 rounded-full text-xs">
                                    vs
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-300 font-medium">
                                {getPlayerName(fixture.awayPlayer, fixture)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="inline-block p-4 bg-yellow-500/10 rounded-full mb-4 border border-yellow-500/20">
                      <AlertTriangle size={32} className="text-yellow-400/80" />
                    </div>
                    <p className="text-gray-400">No fixtures available for this round</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal for updating results */}
        {activeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-yellow-500/20 rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-4 border-b border-yellow-500/20 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-yellow-400 flex items-center">
                <Trophy size={18} className="mr-2" />
                {/* UPDATE: Dynamic title based on edit mode */}
                {editMode ? 'Edit Match Result' : 'Add Match Result'}
              </h3>
              <button
                className="text-gray-400 hover:text-white transition-colors"
                onClick={closeModal}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              {fixtures
                .filter(fixture => fixture._id === activeModal)
                .map(fixture => (
                  <div key={fixture._id} className="space-y-4">
                      <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-700/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          {/* Home Player */}
                          <div className="text-center">
                            <div className="mb-2 mx-auto w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                              <span className="text-yellow-400 font-bold">
                                {renderPlayerInitials(fixture.homePlayer, fixture)}
                              </span>
                            </div>
                            <h6 className="text-sm text-gray-300 font-medium">
                              {getPlayerName(fixture.homePlayer, fixture)}
                            </h6>
                          </div>

                          {/* VS & Inputs */}
                          <div className="flex flex-col items-center mx-4">
                            <span className="text-yellow-400 font-bold mb-2 text-sm">VS</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                className="w-12 h-10 text-center bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 focus:border-yellow-500/50 focus:outline-none transition-colors"
                                value={scoreInputs.homeScore}
                                onChange={(e) => handleScoreChange('homeScore', e.target.value)}
                                min="0"
                              />
                              <span className="text-yellow-400">-</span>
                              <input
                                type="number"
                                className="w-12 h-10 text-center bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 focus:border-yellow-500/50 focus:outline-none transition-colors"
                                value={scoreInputs.awayScore}
                                onChange={(e) => handleScoreChange('awayScore', e.target.value)}
                                min="0"
                              />
                            </div>
                          </div>

                          {/* Away Player */}
                          <div className="text-center">
                            <div className="mb-2 mx-auto w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                              <span className="text-yellow-400 font-bold">
                                {renderPlayerInitials(fixture.awayPlayer, fixture)}
                              </span>
                            </div>
                            <h6 className="text-sm text-gray-300 font-medium">
                              {getPlayerName(fixture.awayPlayer, fixture)}
                            </h6>
                          </div>
                        </div>
                      </div>
                      <button
                      className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black rounded-lg hover:from-yellow-400 hover:to-yellow-300 transition-all duration-200 flex items-center justify-center font-medium"
                      onClick={() => handleSubmitScore(fixture._id)}
                    >
                      <CheckCircle size={18} className="mr-2" />
                      {/* UPDATE: Dynamic button text */}
                      {editMode ? 'Update Result' : 'Save Result'}
                    </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultKo;
