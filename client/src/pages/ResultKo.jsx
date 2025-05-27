import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import fixtureService from '../services/fixtureService';
import { Trophy, ChevronLeft, Clock, Award, Calendar, Users, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
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
  }, [competitionId, selectedCompetition]);

  // Load fixtures for the selected competition
  const loadFixtures = async (competition) => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      // Fetch fixtures for the selected competition
      let fixturesData = await fixtureService.fetchFixturesByCompetition(competition._id);
      console.log("Competition ID:", competition._id);
      console.log('Fetched fixtures:', fixturesData);
      // If no fixtures exist, generate them automatically
      if (fixturesData.length === 0) {
        await fixtureService.generateFixtures(competition._id);
        fixturesData = await fixtureService.fetchFixturesByCompetition(competition._id);
        console.log('Generated fixtures:', fixturesData);
      }

      setFixtures(fixturesData);

      // Organize fixtures by rounds
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

  // Handle fixture result update
  const handleUpdateResult = async (fixtureId, homeScore, awayScore) => {
    try {
      setLoading(true);
      await fixtureService.updateKoFixtureResult(fixtureId, parseInt(homeScore), parseInt(awayScore));

      // Refresh data
      const updatedFixtures = await fixtureService.fetchFixturesByCompetition(selectedCompetition._id);
      setFixtures(updatedFixtures);

      // Force re-evaluation of rounds
      organizeFixturesByRound(updatedFixtures, selectedCompetition);

      setSuccessMessage('Result updated successfully!');
      setLoading(false);
    } catch (err) {
      setError('Failed to update result');
      setLoading(false);
      console.log('Current Round:', currentRound);
      console.log('Rounds List:', rounds);
      console.log('Is Round Completed:', isRoundCompleted());
      console.log('Has Next Round:', hasNextRound());
      console.log('Button Enabled:', isNextRoundButtonEnabled());
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

  // Check if there is a next round available - FIXED VERSION
  const hasNextRound = () => {
    if (!rounds || rounds.length === 0) return false;

    // Check if there are any rounds after the current round in the tournament structure
    const roundOrder = {
      'Round of 32': 1,
      'Round of 16': 2,
      'Quarter Finals': 3,
      'Semi Finals': 4,
      'Final': 5
    };

    const currentRoundOrder = roundOrder[currentRound];
    return currentRoundOrder < 5;  // Final is always the last round
  };

  // Determine if the next round button should be enabled
  const isNextRoundButtonEnabled = () => {
    // Only enable if current round is completed AND there's a next round
    return isRoundCompleted() && hasNextRound();
  };
  // Get players with their names
    const getPlayerName = (player) => {
    if (!player) return 'Unknown Player';
    
    // Handle both direct player objects and player IDs
    const playerObj = typeof player === 'object' ? player : 
      fixtures.find(f => f.homePlayer?._id === player)?.homePlayer || 
      fixtures.find(f => f.awayPlayer?._id === player)?.awayPlayer;

    if (!playerObj) return 'Unknown Player';

    // Handle different name formats
    if (playerObj.firstName && playerObj.lastName) {
      return `${playerObj.firstName} ${playerObj.lastName}`;
    }
    if (playerObj.name) {
      return playerObj.name;
    }
    return 'Unknown Player';
  };

  // Get status badge color based on status
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-900/30 text-gold-500 border border-emerald-800';
      case 'pending': return 'bg-amber-900/30 text-gold-500 border border-amber-800';
      case 'upcoming': return 'bg-sky-900/30 text-gold-500 border border-sky-800';
      default: return 'bg-black-800 text-gold-500 border border-gold-800';
    }
  };

  // Get status icon based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="me-1" />;
      case 'pending': return <Clock size={16} className="me-1" />;
      case 'upcoming': return <Calendar size={16} className="me-1" />;
      default: return <Activity size={16} className="me-1" />;
    }
  };

  // Render loading spinner
  const renderLoadingSpinner = () => (
    <div className="fixed inset-0 bg-black-900/95 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="animate-pulse-slow rounded-full h-16 w-16 border-4 border-gold-500 border-t-transparent"></div>
    </div>
  );
 const renderPlayerInitials = (player) => {
    const name = getPlayerName(player);
    return name
      .split(' ')
      .map(n => n?.[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2) || '?';
  };
  // Render alert messages
  const renderAlerts = () => (
    <>
      {error && (
        <div className="alert alert-danger d-flex align-items-center fade show shadow-sm" role="alert">
          <AlertTriangle size={18} className="me-2" />
          <div>{error}</div>
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success d-flex align-items-center fade show shadow-sm" role="alert">
          <CheckCircle size={18} className="me-2" />
          <div>{successMessage}</div>
        </div>
      )}
    </>
  );

  if (!selectedCompetition) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">Competition not found</div>
      </div>
    );
  }

  return (
    <div className="result-ko container mx-auto px-4 py-8 bg-black-900 min-h-screen">
      {/* Header Section */}
      <div className="bg-black-800 border border-gold-800 rounded-xl mb-8 p-6 shadow-gold-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gold-500/10 rounded-lg border border-gold-800">
              <Trophy size={32} className="text-gold-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gold-500 mb-1">Tournament Fixtures & Results</h2>
              <p className="text-gold-400/80 font-light">Manage fixtures, update results, and advance players through the tournament</p>
            </div>
          </div>
          <button
            className="btn bg-black-800 border border-gold-800 text-gold-500 hover:bg-gold-500/10 transition-colors flex items-center"
            onClick={() => navigate('/admin/manage-kos')}
          >
            <ChevronLeft size={18} className="mr-1" /> Back
          </button>
        </div>
      </div>

      {renderAlerts()}

      {loading ? renderLoadingSpinner() : (
        <div className="selected-competition space-y-6">
          {/* Competition Info Card */}
          <div className="bg-black-800 border border-gold-800 rounded-xl p-6 shadow-gold-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-2xl font-bold text-gold-500">{selectedCompetition.name}</h3>
                  <span className={`${getStatusBadgeColor(selectedCompetition.status)} px-3 py-1 rounded-full`}>
                    {selectedCompetition.status}
                  </span>
                </div>
                <div className="flex space-x-3">
                  <span className="badge bg-gold-500/10 text-gold-500 border border-gold-800 px-3 py-1 rounded-full">
                    <Award size={14} className="mr-1" /> {selectedCompetition.type.replace('KO_', '')}
                  </span>
                  <span className="badge bg-gold-500/10 text-gold-500 border border-gold-800 px-3 py-1 rounded-full">
                    <Users size={14} className="mr-1" /> {selectedCompetition.numberOfPlayers} players
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tournament Progress Section */}
          {rounds.length > 0 && (
            <div className="bg-black-800 border border-gold-800 rounded-xl p-6 shadow-gold-lg">
              <h5 className="text-xl font-semibold text-gold-500 mb-4">Tournament Progress</h5>
              <div className="space-y-4">
                {/* Desktop Progress */}
                <div className="hidden md:block relative h-2 bg-gold-800/20 rounded-full mb-8">
                  <div
                    className="absolute h-2 bg-gold-500 rounded-full transition-all duration-500"
                    style={{ width: `${(rounds.indexOf(currentRound) / (rounds.length - 1)) * 100}%` }}
                  ></div>
                  {rounds.map((round, index) => (
                    <div
                      key={round}
                      className="absolute top-1/2 -translate-y-1/2"
                      style={{ left: `${(index / (rounds.length - 1)) * 100}%` }}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all ${currentRound === round
                          ? 'bg-gold-500 border-2 border-gold-500 scale-125'
                          : 'bg-black-900 border-2 border-gold-500 hover:scale-110'
                          }`}
                        onClick={() => setCurrentRound(round)}
                      >
                        <span className={`text-sm font-bold ${currentRound === round ? 'text-black-900' : 'text-gold-500'}`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="mt-4 text-center w-24 -ml-8">
                        <span className={`text-sm ${currentRound === round ? 'text-gold-500 font-medium' : 'text-gold-500/70'}`}>
                          {round}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile Progress */}
                <div className="md:hidden grid grid-cols-2 gap-2">
                  {rounds.map(round => (
                    <button
                      key={round}
                      className={`text-sm py-2 rounded-lg transition-colors ${currentRound === round
                        ? 'bg-gold-500 text-black-900 font-medium'
                        : 'bg-gold-500/10 text-gold-500 border border-gold-800 hover:bg-gold-500/20'
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
                    className={`w-full md:w-auto py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-all ${isNextRoundButtonEnabled()
                      ? 'bg-gold-500 text-black-900 hover:bg-gold-600'
                      : 'bg-gold-500/20 text-gold-500/50 cursor-not-allowed'
                      }`}
                    disabled={!isNextRoundButtonEnabled()}
                    onClick={handleAdvanceToNextRound}
                  >
                    <Trophy size={20} />
                    <span className="font-medium">Advance Winners</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Fixtures Section */}
          <div className="bg-black-800 border border-gold-800 rounded-xl overflow-hidden shadow-gold-lg">
            <div className="px-6 py-4 border-b border-gold-800 bg-black-900 flex items-center justify-between">
              <h5 className="text-xl font-semibold text-gold-500 flex items-center">
                <Trophy size={20} className="mr-2" />
                {currentRound} Fixtures
              </h5>
              {isRoundCompleted() && (
                <span className="badge bg-emerald-900/30 text-emerald-400 border border-emerald-800 px-3 py-1.5 rounded-full flex items-center">
                  <CheckCircle size={16} className="mr-1" />
                  All matches completed
                </span>
              )}
            </div>

            <div className="p-6">
              {Array.isArray(fixtures) && fixtures.filter(fixture => fixture.round === currentRound).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black-900">
                      <tr>
                        {['Home Player', 'Score', 'Away Player', 'Status', 'Actions'].map((header, idx) => (
                          <th
                            key={header}
                            className={`px-4 py-3 text-left text-gold-500 font-medium ${idx === 0 ? 'rounded-l-lg' : idx === 4 ? 'rounded-r-lg' : ''
                              }`}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold-800/20">
                      {fixtures
                        .filter(fixture => fixture.round === currentRound)
                        .map(fixture => {
                          const homePlayerName = fixture.homePlayer.firstName ?
                            `${fixture.homePlayer.firstName} ${fixture.homePlayer.lastName}` :
                            getPlayerName(fixture.homePlayer);

                          const awayPlayerName = fixture.awayPlayer.firstName ?
                            `${fixture.awayPlayer.firstName} ${fixture.awayPlayer.lastName}` :
                            getPlayerName(fixture.awayPlayer);

                          return (
                            <tr key={fixture._id} className="hover:bg-gold-500/5 transition-colors">
                              <td className="px-4 py-3 text-gold-400 font-medium">{getPlayerName(fixture.homePlayer)}</td>
                              <td className="py-3 text-center">
                                {fixture.status === 'completed' ? (
                                  <div className="px-3 py-1 bg-gold-500/10 rounded-full inline-flex items-center justify-center">
                                    <span className={`font-bold ${fixture.homeScore > fixture.awayScore ? 'text-emerald-400' : 'text-gold-400'
                                      }`}>
                                      {fixture.homeScore}
                                    </span>
                                    <span className="mx-2 text-gold-500">-</span>
                                    <span className={`font-bold ${fixture.awayScore > fixture.homeScore ? 'text-emerald-400' : 'text-gold-400'
                                      }`}>
                                      {fixture.awayScore}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="badge bg-gold-500/10 text-gold-500 border border-gold-800">
                                    Not played
                                  </span>
                                )}
                              </td>
                              <td className="text-gold-400 font-medium">{awayPlayerName}</td>
                              <td className="py-3">
                                <span className={`badge flex items-center ${getStatusBadgeColor(fixture.status)}`}>
                                  {getStatusIcon(fixture.status)}
                                  {fixture.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {fixture.status === 'pending' ? (
                                  <button
                                    className="btn bg-gold-500/10 text-gold-500 border border-gold-800 hover:bg-gold-500/20 flex items-center transition-colors"
                                    data-bs-toggle="modal"
                                    data-bs-target={`#resultModal-${fixture._id}`}
                                  >
                                    <Activity size={16} className="mr-2" />
                                    Update Result
                                  </button>
                                ) : (
                                  <span className="text-emerald-400 flex items-center">
                                    <CheckCircle size={16} className="mr-2" />
                                    Completed
                                  </span>
                                )}

                                {/* Modal */}
                                <div
                                  className="modal fade"
                                  id={`resultModal-${fixture._id}`}
                                  tabIndex="-1"
                                  aria-labelledby={`resultModalLabel-${fixture._id}`}
                                  aria-hidden="true"
                                >
                                  <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content bg-black-800 border border-gold-800 rounded-xl">
                                      <div className="modal-header border-b border-gold-800 p-4">
                                        <h5 className="modal-title text-gold-500 flex items-center">
                                          <Trophy size={20} className="mr-2" />
                                          Update Match Result
                                        </h5>
                                        <button
                                          type="button"
                                          className="btn-close text-gold-500"
                                          data-bs-dismiss="modal"
                                          aria-label="Close"
                                        ></button>
                                      </div>
                                      <div className="modal-body p-4">
                                        <form onSubmit={(e) => {
                                          e.preventDefault();
                                          const homeScore = e.target.homeScore.value;
                                          const awayScore = e.target.awayScore.value;
                                          handleUpdateResult(fixture._id, homeScore, awayScore);
                                          document.querySelector(`#resultModal-${fixture._id} .btn-close`).click();
                                        }}>
                                          <div className="p-4 border border-gold-800 rounded-lg bg-black-900 mb-4">
                                            <div className="flex items-center justify-between">
                                              {/* Home Player */}
                                              <div className="text-center">
                                                <div className="mb-2 mx-auto rounded-full bg-gold-500/10 p-3">
                                                  <span className="text-gold-500 font-bold text-xl">
                                             {renderPlayerInitials(fixture.homePlayer)}
                                                  </span>
                                                </div>
                                                <h6 className="text-gold-400 font-medium">
                                                  {homePlayerName || 'Unknown Player'}
                                                </h6>
                                              </div>

                                              {/* VS & Inputs */}
                                              <div className="flex flex-col items-center mx-4">
                                                <span className="text-gold-500 font-bold mb-2">VS</span>
                                                <div className="flex items-center gap-2">
                                                  <input
                                                    type="number"
                                                    className="w-12 text-center bg-black-800 border border-gold-800 rounded-lg text-gold-400 py-2"
                                                    name="homeScore"
                                                    min="0"
                                                    required
                                                    defaultValue={fixture.homeScore || 0}
                                                  />
                                                  <span className="text-gold-500">-</span>
                                                  <input
                                                    type="number"
                                                    className="w-12 text-center bg-black-800 border border-gold-800 rounded-lg text-gold-400 py-2"
                                                    name="awayScore"
                                                    min="0"
                                                    required
                                                    defaultValue={fixture.awayScore || 0}
                                                  />
                                                </div>
                                              </div>

                                              {/* Away Player */}
                                              <div className="text-center">
                                                <div className="mb-2 mx-auto rounded-full bg-gold-500/10 p-3">
                                                  <span className="text-gold-500 font-bold text-xl">
                                                    {renderPlayerInitials(fixture.awayPlayer)}
                                                  </span>
                                                </div>
                                                <h6 className="text-gold-400 font-medium">{awayPlayerName || 'Unknown Player'}</h6>
                                              </div>

                                            </div>
                                          </div>
                                          <button
                                            type="submit"
                                            className="w-full py-2 bg-gold-500 text-black-900 rounded-lg hover:bg-gold-600 transition-colors flex items-center justify-center"
                                          >
                                            <CheckCircle size={18} className="mr-2" />
                                            Save Result
                                          </button>
                                        </form>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="inline-block p-4 bg-gold-500/10 rounded-full mb-4 border border-gold-800">
                    <AlertTriangle size={40} className="text-gold-500/80" />
                  </div>
                  <p className="text-gold-400/70">No fixtures available for this round</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultKo;